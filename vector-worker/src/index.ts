import { createClient } from "@supabase/supabase-js";

interface VectorQueueMessage {
	recordId: string;
	table: string;
	operation: "INSERT" | "UPDATE" | "DELETE";
	timestamp: string;
}

interface Env {
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	BACKFILL_SECRET?: string;
	VECTOR_WEBHOOK_SECRET?: string;
	inventory_vector_queue?: Queue;
	inventory_vector_dlq?: Queue;
}

function toU8(value: string): Uint8Array {
	return new TextEncoder().encode(value);
}

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function signWebhook(secret: string, rawBody: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		toU8(secret) as BufferSource,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, toU8(rawBody) as BufferSource);
	const sigBytes = new Uint8Array(signature);
	return `sha256=${toHex(sigBytes.buffer)}`;
}

async function verifyWebhook(
	secret: string,
	rawBody: string,
	signatureHeader: string | null,
): Promise<boolean> {
	if (!secret || !signatureHeader) return false;
	const expected = await signWebhook(secret, rawBody);
	return signatureHeader === expected;
}

async function runBackfill(env: Env) {
	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
	}

	const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const started = Date.now();
	const { data, error } = await supabase.rpc("backfill_inventory_vectors");
	if (error) throw error;

	return {
		rows: data,
		durationMs: Date.now() - started,
	};
}

async function runVectorizeRecord(env: Env, recordId: string) {
	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
	}

	const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const started = Date.now();
	const { data, error } = await supabase.rpc("create_inventory_vector", {
		p_record_id: recordId,
	});
	if (error) throw error;

	return {
		recordId,
		rows: data,
		durationMs: Date.now() - started,
	};
}

export default {
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(
			runBackfill(env)
				.then((result) => {
					console.log(
						`[${new Date().toISOString()}] daily backfill completed: ${result.rows} row(s) in ${result.durationMs}ms`,
					);
				})
				.catch((error) => {
					console.error(
						`[${new Date().toISOString()}] daily backfill failed: ${error.message}`,
					);
				}),
		);
	},

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/__health") {
			return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/__backfill" && request.method === "POST") {
			const expectedSecret = env.BACKFILL_SECRET;
			const authHeader = request.headers.get("Authorization")?.trim();
			const token = authHeader?.startsWith("Bearer ")
				? authHeader.slice(7).trim()
				: request.headers.get("x-backfill-token")?.trim();

			if (expectedSecret && token !== expectedSecret) {
				return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});
			}

			console.log("Manual trigger via /__backfill");
			try {
				const result = await runBackfill(env);
				return new Response(JSON.stringify({ ok: true, ...result }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err: any) {
				return new Response(JSON.stringify({ ok: false, error: err.message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		if (url.pathname === "/webhooks/supabase" && request.method === "POST") {
			const rawBody = await request.text();
			const signature = request.headers.get("x-webhook-signature");

			const valid = await verifyWebhook(env.VECTOR_WEBHOOK_SECRET || "", rawBody, signature);
			if (!valid) {
				console.warn(`[${new Date().toISOString()}] webhook signature verification failed`);
				return new Response("Unauthorized", { status: 401 });
			}

			let payload: any;
			try {
				payload = JSON.parse(rawBody);
			} catch {
				return new Response("Bad Request", { status: 400 });
			}

			const recordId = payload?.record?.id;
			if (!recordId) {
				return new Response("Bad Request: missing record.id", { status: 400 });
			}

			const message: VectorQueueMessage = {
				recordId,
				table: payload.table || "",
				operation: payload.type || "INSERT",
				timestamp: new Date().toISOString(),
			};

			if (env.inventory_vector_queue) {
				await env.inventory_vector_queue.send(message);
				console.log(
					`[${new Date().toISOString()}] enqueued record ${recordId} from ${message.table}`,
				);
			}

			return new Response("OK", { status: 200 });
		}

		return new Response("Not found", { status: 404 });
	},

	async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
		const queueName = batch.queue;
		if (queueName === "inventory-vector-queue") {
			for (const msg of batch.messages) {
				try {
					const body = msg.body as VectorQueueMessage;
					const result = await runVectorizeRecord(env, body.recordId);
					console.log(
						`[${new Date().toISOString()}] vectorized record ${result.recordId} in ${result.durationMs}ms`,
					);
					msg.ack();
				} catch (error: any) {
					console.error(
						`[${new Date().toISOString()}] vectorize record failed: ${error.message}`,
					);
					msg.retry();
				}
			}
		} else if (queueName === "inventory-vector-dlq") {
			console.log(`[${new Date().toISOString()}] DLQ message received, acking`);
			for (const msg of batch.messages) {
				msg.ack();
			}
		} else {
			console.warn(`[${new Date().toISOString()}] unknown queue: ${queueName}`);
		}
	},
} satisfies ExportedHandler<Env>;
