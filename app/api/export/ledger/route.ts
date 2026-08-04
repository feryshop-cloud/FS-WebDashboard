import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExcelBuffer, formatDate, createExcelResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
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

    const rows = (ledgerData || []).map((item: Record<string, unknown>) => [
      formatDate(item.created_at as string),
      (item.accounts as { name?: string })?.name || "-",
      item.type === "IN" ? "Masuk" : "Keluar",
      item.amount || 0,
      item.description || "-",
      item.reference_id || "-",
      item.status || "completed",
    ]);

    const buffer = generateExcelBuffer(rows, headers, "Mutasi Saldo");

    const filename = `Laporan_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`;
    return createExcelResponse(buffer, filename);
  } catch (error: unknown) {
    console.error("Export Ledger Error:", error);
    const message = error instanceof Error ? error.message : "Failed to export ledger";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
