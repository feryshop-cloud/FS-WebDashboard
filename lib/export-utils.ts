import * as xlsx from "xlsx";

/**
 * Converts an array of objects or 2D matrix data into an Excel spreadsheet binary Buffer (.xlsx).
 *
 * @param data - Array of row objects or raw matrix array values to export.
 * @param headers - Optional array of column header titles.
 * @param sheetName - Name of target Excel sheet (defaults to "Sheet1").
 * @returns Node.js Buffer containing compiled `.xlsx` binary data.
 */
export function generateExcelBuffer(
  data: unknown[],
  headers?: string[],
  sheetName: string = "Sheet1",
): Buffer {
  // Jika headers disediakan, jadikan array pertama sebagai header
  const worksheetData = headers ? [headers, ...data] : data;

  // Opsi: skipHeader true jika data sudah berbentuk matrix (array of arrays)
  // atau jika kita manual sisipkan header di array pertama
  const isMatrix = headers || (data.length > 0 && Array.isArray(data[0]));

  const worksheet = isMatrix
    ? xlsx.utils.aoa_to_sheet(worksheetData as unknown[][])
    : xlsx.utils.json_to_sheet(data);

  // Buat workbook baru dan append sheet
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Set properti kolom sederhana (auto width sederhana)
  if (headers && worksheet["!ref"]) {
    const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 10) + 2 }));
    worksheet["!cols"] = colWidths;
  }

  // Tulis workbook sebagai buffer node
  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return buffer;
}

/**
 * Fungsi helper untuk download dari browser (Client Side / API Route Return)
 */
export function createExcelResponse(buffer: Buffer, filename: string): Response {
  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    status: 200,
  });
}

export function formatRupiah(number: number | null | undefined): string {
  if (number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}
