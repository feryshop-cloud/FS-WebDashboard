import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const serviceUrl = (process.env.DIGIFLAZZ_SERVICE_URL || "http://localhost:3002").replace(
      /\/+$/,
      "",
    );
    const serviceApiKey = process.env.DIGIFLAZZ_SERVICE_API_KEY || "";

    const targetUrl = `${serviceUrl}/v1/balance${forceRefresh ? "?refresh=true" : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (serviceApiKey) {
      headers["Authorization"] = `Bearer ${serviceApiKey}`;
      headers["x-api-key"] = serviceApiKey;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      let errorMessage = `Layanan Digiflazz mengembalikan status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errorMessage = errorJson.message;
        } else if (errorJson?.error) {
          errorMessage = String(errorJson.error);
        }
      } catch {
        const errorText = await response.text().catch(() => "");
        if (errorText) {
          errorMessage = errorText.slice(0, 200);
        }
      }

      logger.warn("Digiflazz service balance check returned non-ok", {
        status: response.status,
        error: errorMessage,
      });

      return NextResponse.json(
        {
          ok: false,
          error: errorMessage,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Failed to proxy Digiflazz balance request", { error });
    return NextResponse.json(
      {
        ok: false,
        error: "Layanan Digiflazz tidak dapat dihubungi",
      },
      { status: 503 },
    );
  }
}
