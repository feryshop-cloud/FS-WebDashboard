import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createGmailAccount,
  updateGmailAccount,
  updateGmailAccountStatus,
  deleteGmailAccount,
} from "@/app/actions/gmail-accounts";
import { decryptCredential } from "./crypto";
import { parseBackupCodes, maskBackupCodes } from "./utils";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-user-uuid" } },
      }),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Gmail Accounts Server Actions Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: "admin-user-uuid" }, error: null });
  });

  describe("createGmailAccount", () => {
    it("mengembalikan error jika email kosong", async () => {
      const formData = new FormData();
      formData.set("email", "");
      formData.set("google_password", "pass123");

      const result = await createGmailAccount(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Alamat email Gmail wajib diisi.");
    });

    it("berhasil mengenkripsi kata sandi & kode cadangan sebelum disimpan", async () => {
      const formData = new FormData();
      formData.set("email", "testaccount@gmail.com");
      formData.set("google_password", "mySecretGooglePassword");
      formData.set("backup_codes", "11223344, 55667788");
      formData.set("status", "Diproses");
      formData.set("notes", "Akun baru");

      const result = await createGmailAccount(formData);
      expect(result.success).toBe(true);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      const insertedPayload = mockInsert.mock.calls[0][0];

      expect(insertedPayload.email).toBe("testaccount@gmail.com");
      expect(insertedPayload.status).toBe("Diproses");
      expect(insertedPayload.managed_by).toBe("admin-user-uuid");

      // Verifikasi bahwa password tersimpan dalam keadaan terenkripsi
      expect(insertedPayload.google_password).not.toBe("mySecretGooglePassword");
      expect(insertedPayload.google_password).toContain(":");
      expect(decryptCredential(insertedPayload.google_password)).toBe("mySecretGooglePassword");

      // Verifikasi kode cadangan tersimpan dalam keadaan terenkripsi
      expect(insertedPayload.backup_codes).not.toBe("11223344, 55667788");
      expect(decryptCredential(insertedPayload.backup_codes)).toBe("11223344, 55667788");
    });
  });

  describe("updateGmailAccount", () => {
    it("mengembalikan error jika ID akun kosong", async () => {
      const formData = new FormData();
      formData.set("email", "test@gmail.com");

      const result = await updateGmailAccount("", formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("ID akun wajib diisi.");
    });

    it("memperbarui akun dengan enkripsi kredensial baru", async () => {
      const formData = new FormData();
      formData.set("email", "updated@gmail.com");
      formData.set("google_password", "newUpdatedPassword");
      formData.set("backup_codes", "99887766");
      formData.set("status", "Stok Permanen");

      const result = await updateGmailAccount("account-uuid-1", formData);
      expect(result.success).toBe(true);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdate.mock.calls[0][0];

      expect(updatePayload.email).toBe("updated@gmail.com");
      expect(updatePayload.status).toBe("Stok Permanen");
      expect(decryptCredential(updatePayload.google_password)).toBe("newUpdatedPassword");
      expect(mockEq).toHaveBeenCalledWith("id", "account-uuid-1");
    });
  });

  describe("updateGmailAccountStatus", () => {
    it("memperbarui status akun dan mencatat admin yang mengubah", async () => {
      const result = await updateGmailAccountStatus(
        "account-uuid-1",
        "Diserahkan ke Customer",
        "Serah terima buyer",
      );
      expect(result.success).toBe(true);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdate.mock.calls[0][0];

      expect(updatePayload.status).toBe("Diserahkan ke Customer");
      expect(updatePayload.notes).toBe("Serah terima buyer");
      expect(updatePayload.managed_by).toBe("admin-user-uuid");
      expect(mockEq).toHaveBeenCalledWith("id", "account-uuid-1");
    });
  });

  describe("deleteGmailAccount", () => {
    it("mengembalikan error jika ID akun tidak ada", async () => {
      const result = await deleteGmailAccount("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("ID akun wajib diisi.");
    });

    it("menghapus akun dengan id yang sesuai", async () => {
      const result = await deleteGmailAccount("account-uuid-to-delete");
      expect(result.success).toBe(true);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith("id", "account-uuid-to-delete");
    });
  });

  describe("parseBackupCodes (Google 10 Kode × 8 Digit)", () => {
    it("berhasil mem-parsing 10 kode Google dengan format spasi (4-4 digit)", () => {
      const raw = `1234 5678
2345 6789
3456 7890
4567 8901
5678 9012
6789 0123
7890 1234
8901 2345
9012 3456
0123 4567`;

      const parsed = parseBackupCodes(raw);
      expect(parsed).toHaveLength(10);
      expect(parsed[0]).toBe("12345678");
      expect(parsed[9]).toBe("01234567");
      expect(parsed.every((code) => code.length === 8)).toBe(true);
    });

    it("berhasil mem-parsing 10 kode Google tanpa spasi (8 digit langsung)", () => {
      const raw = `11223344
22334455
33445566
44556677
55667788
66778899
77889900
88990011
99001122
00112233`;

      const parsed = parseBackupCodes(raw);
      expect(parsed).toHaveLength(10);
      expect(parsed[0]).toBe("11223344");
      expect(parsed[9]).toBe("00112233");
    });

    it("menangani input kosong atau null dengan aman", () => {
      expect(parseBackupCodes("")).toEqual([]);
      expect(parseBackupCodes(null)).toEqual([]);
      expect(parseBackupCodes(undefined)).toEqual([]);
    });

    it("menangani kode yang dipisahkan dengan koma atau campuran spasi", () => {
      const raw = "1234 5678, 8765 4321, 9988 7766";
      const parsed = parseBackupCodes(raw);
      expect(parsed).toEqual(["12345678", "87654321", "99887766"]);
    });

    it("berhasil mem-parsing 10 kode Google yang dipisahkan tanda koma", () => {
      const raw =
        "11112222, 22223333, 33334444, 44445555, 55556666, 66667777, 77778888, 88889999, 99990000, 00001111";
      const parsed = parseBackupCodes(raw);
      expect(parsed).toHaveLength(10);
      expect(parsed[0]).toBe("11112222");
      expect(parsed[9]).toBe("00001111");
      expect(parsed.every((c) => c.length === 8)).toBe(true);
    });
  });

  describe("maskBackupCodes (Obfuscasi Kode dengan Koma Tetap Terlihat Apa Adanya)", () => {
    it("meng-obfuscate digit menjadi bullet namun mempertahankan koma dan spasi apa adanya", () => {
      const raw = "12345678, 87654321, 11223344";
      const masked = maskBackupCodes(raw);
      expect(masked).toBe("••••••••, ••••••••, ••••••••");
    });

    it("mempertahankan koma tanpa spasi apa adanya", () => {
      const raw = "11112222,33334444";
      const masked = maskBackupCodes(raw);
      expect(masked).toBe("••••••••,••••••••");
    });

    it("mempertahankan format baris baru (newline)", () => {
      const raw = "1234 5678\n8765 4321";
      const masked = maskBackupCodes(raw);
      expect(masked).toBe("•••• ••••\n•••• ••••");
    });

    it("menangani input kosong atau null dengan aman", () => {
      expect(maskBackupCodes("")).toBe("");
      expect(maskBackupCodes(null)).toBe("");
      expect(maskBackupCodes(undefined)).toBe("");
    });
  });
});
