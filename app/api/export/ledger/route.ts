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
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");

    const supabase = await createClient();

    let query = supabase
      .from("finance_ledger")
      .select(
        `
        *,
        accounts ( name )
      `,
      )
      .order("created_at", { ascending: false });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (type === "IN") {
      query = query.gt("amount", 0);
    } else if (type === "OUT") {
      query = query.lt("amount", 0);
    }

    const { data: ledgerData, error } = await query;

    if (error) {
      throw error;
    }

    const headers = [
      "Tanggal",
      "Rekening",
      "Tipe Mutasi",
      "Nominal",
      "Keterangan",
      "Reference ID",
      "Status",
    ];

    const rows = (ledgerData || []).map((item: any) => [
      formatDate(item.created_at),
      item.accounts?.name || "-",
      item.type === "IN" ? "Masuk" : "Keluar",
      item.amount || 0,
      item.description || "-",
      item.reference_id || "-",
      item.status || "completed",
    ]);

    const buffer = generateExcelBuffer(rows, headers, "Mutasi Saldo");

    const filename = `Laporan_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`;
    return createExcelResponse(buffer, filename);
  } catch (error: any) {
    console.error("Export Ledger Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export ledger" },
      { status: 500 },
    );
  }
}
