import { describe, expect, it } from "vitest";
import * as xlsx from "xlsx";
import {
  generateExcelBuffer,
  createExcelResponse,
  formatRupiah,
  formatDate,
} from "@/lib/export-utils";

describe("generateExcelBuffer", () => {
  it("produces a Buffer from array-of-objects data", () => {
    const data = [
      { Name: "Alice", Score: 90 },
      { Name: "Bob", Score: 85 },
    ];
    const buffer = generateExcelBuffer(data);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);

    // Verify it's a valid xlsx by reading it back
    const wb = xlsx.read(buffer, { type: "buffer" });
    expect(wb.SheetNames).toContain("Sheet1");

    const ws = wb.Sheets["Sheet1"];
    const rows = xlsx.utils.sheet_to_json(ws);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ Name: "Alice", Score: 90 });
  });

  it("uses custom sheet name", () => {
    const data = [{ A: 1 }];
    const buffer = generateExcelBuffer(data, undefined, "MySheet");

    const wb = xlsx.read(buffer, { type: "buffer" });
    expect(wb.SheetNames).toContain("MySheet");
  });

  it("handles matrix data with headers array", () => {
    const data = [
      ["Alice", 90],
      ["Bob", 85],
    ];
    const headers = ["Name", "Score"];
    const buffer = generateExcelBuffer(data, headers);

    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets["Sheet1"];
    const rows = xlsx.utils.sheet_to_json(ws);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ Name: "Alice", Score: 90 });
  });

  it("sets column widths when headers are provided", () => {
    const data = [["short", "x"]];
    const headers = ["ShortCol", "A Very Long Header Name"];
    const buffer = generateExcelBuffer(data, headers);

    // Verify the buffer is valid and contains the header values
    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets["Sheet1"];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 });
    // First row should be headers
    expect(rows[0]).toEqual(["ShortCol", "A Very Long Header Name"]);
    // Second row should be data
    expect(rows[1]).toEqual(["short", "x"]);
  });

  it("handles empty data array", () => {
    const buffer = generateExcelBuffer([]);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe("createExcelResponse", () => {
  it("returns a Response with correct Content-Type header", () => {
    const buffer = Buffer.from("fake xlsx data");
    const response = createExcelResponse(buffer, "report.xlsx");

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  });

  it("includes filename in Content-Disposition header", () => {
    const buffer = Buffer.from("data");
    const response = createExcelResponse(buffer, "inventory-2025.xlsx");

    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="inventory-2025.xlsx"',
    );
  });
});

describe("formatRupiah", () => {
  it("formats positive numbers as IDR", () => {
    const result = formatRupiah(750000);
    expect(result).toContain("Rp");
    expect(result).toContain("750.000");
  });

  it("formats zero", () => {
    const result = formatRupiah(0);
    expect(result).toContain("Rp");
    expect(result).toContain("0");
  });

  it("returns 'Rp 0' for null", () => {
    expect(formatRupiah(null)).toBe("Rp 0");
  });

  it("returns 'Rp 0' for undefined", () => {
    expect(formatRupiah(undefined)).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("formats a valid ISO date string", () => {
    const result = formatDate("2025-01-15T10:30:00Z");
    // Should contain day, month abbreviation, year
    expect(result).toContain("2025");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });

  it("returns '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });

  it("returns '-' for empty string", () => {
    expect(formatDate("")).toBe("-");
  });
});
