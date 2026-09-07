import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const depositSchema = z.object({
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .int({ message: "Nominal harus berupa bilangan bulat" })
    .min(10_000, { message: "Nominal deposit minimal Rp 10.000" })
    .max(100_000_000, { message: "Nominal deposit maksimal Rp 100.000.000" }),
  bank: z.enum(["BCA", "MANDIRI", "BNI", "BRI", "Flip", "ShopeePay"], {
    message: "Pilihan bank harus salah satu dari: BCA, MANDIRI, BNI, BRI, Flip, ShopeePay",
  }),
  ownerName: z
    .string({ message: "Nama pemilik rekening wajib diisi" })
    .trim()
    .min(2, { message: "Nama pemilik rekening minimal 2 karakter" })
    .max(100, { message: "Nama pemilik rekening maksimal 100 karakter" }),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Format request tidak valid (JSON diharapkan)" },
        { status: 400 },
      );
    }

    const parseResult = depositSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ ok: false, error: errorMsg }, { status: 400 });
    }

    const { amount, bank, ownerName } = parseResult.data;

    const serviceUrl = (process.env.DIGIFLAZZ_SERVICE_URL || "http://localhost:3002").replace(
      /\/+$/,
      "",
    );
    const serviceApiKey = process.env.DIGIFLAZZ_SERVICE_API_KEY || "";

    const targetUrl = `${serviceUrl}/v1/deposit`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (serviceApiKey) {
      headers["Authorization"] = `Bearer ${serviceApiKey}`;
      headers["x-api-key"] = serviceApiKey;
    }

    logger.info("Proxying Digiflazz deposit ticket request", {
      userId: user.id,
      amount,
      bank,
      ownerName,
    });

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, bank, ownerName }),
      signal: AbortSignal.timeout(10000),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.ok) {
      const errorMsg =
        json?.message || json?.error || `Layanan Digiflazz mengembalikan status ${response.status}`;
      logger.warn("Digiflazz deposit request failed", {
        status: response.status,
        error: errorMsg,
      });

      return NextResponse.json(
        { ok: false, error: errorMsg },
        { status: response.status >= 400 && response.status < 600 ? response.status : 500 },
      );
    }

    const ticketData = {
      ...json.data,
      expires_at: json.data?.expires_at || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: ticketData,
    });
  } catch (error) {
    logger.error("Failed to proxy Digiflazz deposit request", { error });
    return NextResponse.json(
      {
        ok: false,
        error: "Layanan Digiflazz tidak dapat dihubungi. Pastikan microservice aktif.",
      },
      { status: 503 },
    );
  }
}
