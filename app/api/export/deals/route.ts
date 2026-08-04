import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExcelBuffer, formatDate, createExcelResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("deals")
      .select(
        `
        *,
        stocks ( name, capital_price )
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
      item.deal_number || (typeof item.id === "string" ? item.id.substring(0, 8) : "-"),
      (item.stocks as { name?: string })?.name || "-",
      item.customer_name || "-",
      item.status || "-",
      (item.stocks as { capital_price?: number })?.capital_price || 0,
      item.deal_price || 0,
      Number(item.deal_price || 0) - Number((item.stocks as { capital_price?: number })?.capital_price || 0),
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
