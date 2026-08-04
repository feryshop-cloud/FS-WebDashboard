import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExcelBuffer, formatDate, createExcelResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();

    let query = supabase
      .from("deals")
      .select(
        `
        *,
        games ( name )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status as "COMPLETED");
    }

    const { data: dealsData, error } = await query;

    if (error) {
      throw error;
    }

    const headers = [
      "ID Referensi",
      "Game",
      "Klien/Pembeli",
      "Status",
      "Harga Modal",
      "Harga Jual",
      "Keuntungan",
      "Tgl Deal",
      "Tgl Selesai",
    ];

    const rows = (dealsData || []).map((item: Record<string, unknown>) => [
      item.reference_id || (typeof item.id === "string" ? item.id.substring(0, 8) : "-"),
      (item.games as { name?: string })?.name || "-",
      item.client_name || item.buyer_name || "-",
      item.status || "-",
      item.capital_price || 0,
      item.selling_price || 0,
      Number(item.selling_price || 0) - Number(item.capital_price || 0),
      formatDate(item.created_at as string),
      formatDate((item.completed_at || item.updated_at) as string),
    ]);

    const buffer = generateExcelBuffer(rows, headers, "Laporan Deals B2B");

    const filename = `Laporan_Deals_${new Date().toISOString().split("T")[0]}.xlsx`;
    return createExcelResponse(buffer, filename);
  } catch (error: unknown) {
    console.error("Export Deals Error:", error);
    const message = error instanceof Error ? error.message : "Failed to export deals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
