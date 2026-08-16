/**
 * Cryptographic utilities for webhook signature verification.
 *
 * Uses HMAC-SHA256 to sign and verify webhook payloads,
 * ensuring that only legitimate Supabase webhooks are processed.
 */

import { toU8, toHex } from "./helpers";

/**
 * Signs a raw string payload using HMAC-SHA256 with the provided secret.
 *
 * @param secret - The shared secret key used for signing
 * @param rawBody - The raw request body string to sign
 * @returns The signature in the format `sha256=<hex-encoded-signature>`
 */
export async function signWebhook(secret: string, rawBody: string): Promise<string> {
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

/**
 * Verifies a webhook signature against the expected HMAC-SHA256 signature.
 *
 * @param secret - The shared secret key used for verification
 * @param rawBody - The raw request body string that was signed
 * @param signatureHeader - The signature header from the incoming request
 * @returns True if the signature is valid, false otherwise
 */
export async function verifyWebhook(
	secret: string,
	rawBody: string,
	signatureHeader: string | null,
): Promise<boolean> {
	if (!secret || !signatureHeader) return false;
	const expected = await signWebhook(secret, rawBody);
	return signatureHeader === expected;
}
