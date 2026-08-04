import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateExcelBuffer,
  formatRupiah,
  formatDate,
  createExcelResponse,
} from "@/lib/export-utils";

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
      query = query.eq("status", status as any);
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

    const rows = (dealsData || []).map((item: any) => [
      item.reference_id || item.id?.substring(0, 8) || "-",
      item.games?.name || "-",
      item.client_name || item.buyer_name || "-",
      item.status || "-",
      item.capital_price || 0,
      item.selling_price || 0,
      (item.selling_price || 0) - (item.capital_price || 0),
      formatDate(item.created_at),
      formatDate(item.completed_at || item.updated_at),
    ]);

    const buffer = generateExcelBuffer(rows, headers, "Laporan Deals B2B");

    const filename = `Laporan_Deals_${new Date().toISOString().split("T")[0]}.xlsx`;
    return createExcelResponse(buffer, filename);
  } catch (error: any) {
    console.error("Export Deals Error:", error);
    return NextResponse.json({ error: error.message || "Failed to export deals" }, { status: 500 });
  }
}
