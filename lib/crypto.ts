import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 12 bytes IV for AES-GCM (NIST SP 800-38D)
const TAG_LENGTH = 16; // Standard 16 bytes auth tag

/**
 * Mendapatkan encryption key 32-byte (256-bit) yang diturunkan dari environment variable.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.GMAIL_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "feryshop-gmail-inventory-default-fallback-key-2026";

  // Selalu turunkan menjadi tepat 32 bytes melalui SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Mengenkripsi string sensitif menggunakan AES-256-GCM.
 * Output format: `iv_hex:auth_tag_hex:ciphertext_hex`
 */
export function encryptCredential(text: string | null | undefined): string | null {
  if (!text || text.trim() === "") return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error) {
    console.error("Gagal mengenkripsi kredensial:", error);
    throw new Error("Gagal mengenkripsi data kredensial sensitif.");
  }
}

/**
 * Mendekripsi ciphertext AES-256-GCM kembali ke plaintext.
 * Mendukung graceful fallback jika data masih dalam format plaintext lama.
 */
export function decryptCredential(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || encryptedText.trim() === "") return null;

  // Format valid: iv:tag:ciphertext (3 bagian dipisahkan titik dua)
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // Jika bukan format terenkripsi (misal data legacy), kembalikan teks aslinya
    return encryptedText;
  }

  const [ivHex, tagHex, contentHex] = parts;
  if (!ivHex || !tagHex || !contentHex) {
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(contentHex, "hex");

    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
      return encryptedText;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Gagal mendekripsi kredensial:", error);
    // Kembalikan placeholder jika kunci tidak cocok atau data korup
    return "[Gagal Mendekripsi Kredensial]";
  }
}
