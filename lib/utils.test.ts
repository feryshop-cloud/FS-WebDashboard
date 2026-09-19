import { describe, expect, it } from "vitest";
import {
  generateStockName,
  getGameCodeFromName,
  formatRupiah,
  parseBackupCodes,
  maskBackupCodes,
} from "./utils";

describe("generateStockName", () => {
  const KODE = "FF-1100";

  it("returns only Kode Stok if detail is empty or whitespace", () => {
    expect(generateStockName(KODE, "")).toBe("FF-1100");
    expect(generateStockName(KODE, "   \n\n  ")).toBe("FF-1100");
  });

  it("returns only specification if kodeStok is empty", () => {
    const detail = "Legend Alucard\nTas2 Biru Permanent";
    expect(generateStockName("", detail)).toBe("Legend Alucard Tas2 Biru Permanent");
  });

  it("handles single line detail correctly", () => {
    expect(generateStockName(KODE, "Legend Alucard")).toBe("FF-1100 | Legend Alucard");
  });

  it("extracts correctly for exactly 2 lines (first and last, no middle)", () => {
    const detail = "Legend Alucard\nTas2 Biru Permanent";
    expect(generateStockName(KODE, detail)).toBe("FF-1100 | Legend Alucard Tas2 Biru Permanent");
  });

  it("extracts correctly for 3 lines (first, middle, last)", () => {
    const detail = "Legend Alucard\nCollector Haya\nTas2 Biru Permanent";
    expect(generateStockName(KODE, detail)).toBe(
      "FF-1100 | Legend Alucard Collector Haya Tas2 Biru Permanent",
    );
  });

  it("extracts correctly for multiple (7) lines with exact user pattern", () => {
    const detail =
      "Legend Alucard\nSkin Epic Lancelot\nSkin Starlight Gusion\nCollector Haya\nZodiac Selena\nSkin KOF\nTas2 Biru Permanent";
    expect(generateStockName(KODE, detail)).toBe(
      "FF-1100 | Legend Alucard Collector Haya Tas2 Biru Permanent",
    );
  });

  it("cleans up whitespace and ignores empty lines", () => {
    const detail =
      "  Legend Alucard  \r\n\r\n  Skin Epic Lancelot\r\n  Collector Haya  \r\n\r\n  Tas2 Biru Permanent  ";
    expect(generateStockName(KODE, detail)).toBe(
      "FF-1100 | Legend Alucard Collector Haya Tas2 Biru Permanent",
    );
  });
});

describe("getGameCodeFromName", () => {
  it("derives correct abbreviation from multi-word game names", () => {
    expect(getGameCodeFromName("Free Fire")).toBe("FF");
    expect(getGameCodeFromName("Mobile Legends")).toBe("ML");
    expect(getGameCodeFromName("Genshin Impact")).toBe("GI");
  });

  it("derives first 2 letters for single-word game names", () => {
    expect(getGameCodeFromName("Roblox")).toBe("RO");
    expect(getGameCodeFromName("Valorant")).toBe("VA");
  });

  it("handles fallback if name is empty", () => {
    expect(getGameCodeFromName("")).toBe("GAME");
  });
});
