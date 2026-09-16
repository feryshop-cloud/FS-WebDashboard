import { describe, expect, it } from "vitest";
import { encryptCredential, decryptCredential } from "./crypto";

describe("AES-256-GCM Credential Encryption & Decryption", () => {
  it("mengenkripsi dan mendekripsi kata sandi dengan benar", () => {
    const originalPassword = "SuperSecretPassword123!@#";
    const encrypted = encryptCredential(originalPassword);

    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toBe(originalPassword);
    expect(typeof encrypted).toBe("string");

    // Format: iv:authTag:ciphertext (3 bagian dipisahkan titik dua)
    const parts = (encrypted as string).split(":");
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(24); // 12 bytes IV dalam hex = 24 chars
    expect(parts[1].length).toBe(32); // 16 bytes Tag dalam hex = 32 chars

    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe(originalPassword);
  });

  it("mendukung enkripsi & dekripsi multiline (backup codes 2FA)", () => {
    const backupCodes = "12345678\n87654321\n11223344\n55667788\n99001122";
    const encrypted = encryptCredential(backupCodes);
    const decrypted = decryptCredential(encrypted);

    expect(decrypted).toBe(backupCodes);
  });

  it("mendukung karakter Unicode dan emoji", () => {
    const textWithEmoji = "P@ssw0rd_Rahasia_🔐_2026";
    const encrypted = encryptCredential(textWithEmoji);
    const decrypted = decryptCredential(encrypted);

    expect(decrypted).toBe(textWithEmoji);
  });

  it("menghasilkan ciphertext yang berbeda untuk plaintext yang sama (random IV)", () => {
    const text = "my-same-password";
    const enc1 = encryptCredential(text);
    const enc2 = encryptCredential(text);

    expect(enc1).not.toBe(enc2);
    expect(decryptCredential(enc1)).toBe(text);
    expect(decryptCredential(enc2)).toBe(text);
  });

  it("mengembalikan null jika input null, undefined, atau string kosong", () => {
    expect(encryptCredential(null)).toBeNull();
    expect(encryptCredential(undefined)).toBeNull();
    expect(encryptCredential("")).toBeNull();
    expect(encryptCredential("   ")).toBeNull();

    expect(decryptCredential(null)).toBeNull();
    expect(decryptCredential(undefined)).toBeNull();
    expect(decryptCredential("")).toBeNull();
    expect(decryptCredential("   ")).toBeNull();
  });

  it("melakukan graceful fallback jika data berupa plaintext legacy (belum terenkripsi)", () => {
    const legacyPlaintext = "plain-old-password-not-encrypted";
    // Karena tidak memiliki format iv:tag:ciphertext, harus dikembalikan apa adanya
    const result = decryptCredential(legacyPlaintext);
    expect(result).toBe(legacyPlaintext);
  });

  it("mengembalikan pesan peringatan jika ciphertext dimanipulasi atau rusak (tampering)", () => {
    const original = "valid-secret";
    const encrypted = encryptCredential(original);
    expect(encrypted).not.toBeNull();

    const parts = (encrypted as string).split(":");
    // Rusak ciphertext
    const tampered = `${parts[0]}:${parts[1]}:ff${parts[2].slice(2)}`;

    const result = decryptCredential(tampered);
    expect(result).toBe("[Gagal Mendekripsi Kredensial]");
  });
});
