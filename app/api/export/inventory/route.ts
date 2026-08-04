import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExcelBuffer, formatDate, createExcelResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const gameId = searchParams.get("gameId");

    const supabase = await createClient();

    let query = supabase
      .from("inventory")
      .select(
        `
        *,
        games ( name )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status as "AVAILABLE");
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: inventoryData, error } = await query;

    if (error) {
      throw error;
    }

    const headers = [
      "ID Referensi",
      "Game",
      "Status",
      "Harga Modal",
      "Harga Jual",
      "Harga Terjual",
      "Catatan",
      "Tanggal Ditambahkan",
      "Tanggal Terjual",
    ];

    const rows = (inventoryData || []).map((item: Record<string, unknown>) => [
      item.title_reference || "-",
      (item.games as { name?: string })?.name || "-",
      item.status || "-",
      item.capital_price || 0,
      item.asking_price || 0,
      item.sold_price || "",
      item.notes || "",
      formatDate(item.created_at as string),
      formatDate(item.sold_at as string),
    ]);

    const buffer = generateExcelBuffer(rows, headers, "Laporan Stok");

    const filename = `Laporan_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`;
    return createExcelResponse(buffer, filename);
  } catch (error: unknown) {
    console.error("Export Inventory Error:", error);
    const message = error instanceof Error ? error.message : "Failed to export inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
