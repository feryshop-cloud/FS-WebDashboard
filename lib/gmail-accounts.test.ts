import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createGmailAccount,
  updateGmailAccount,
  updateGmailAccountStatus,
  deleteGmailAccount,
} from "@/app/actions/gmail-accounts";
import { decryptCredential } from "./crypto";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

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
      select: mockSelect,
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
  });

  describe("createGmailAccount", () => {
    it("melempar error jika email kosong", async () => {
      const formData = new FormData();
      formData.set("email", "");
      formData.set("google_password", "pass123");

      await expect(createGmailAccount(formData)).rejects.toThrow("Alamat email Gmail wajib diisi.");
    });

    it("berhasil mengenkripsi kata sandi & kode cadangan sebelum disimpan", async () => {
      const formData = new FormData();
      formData.set("email", "testaccount@gmail.com");
      formData.set("google_password", "mySecretGooglePassword");
      formData.set("backup_codes", "11223344, 55667788");
      formData.set("status", "Diproses");
      formData.set("notes", "Akun baru");

      await createGmailAccount(formData);

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
    it("melempar error jika ID akun kosong", async () => {
      const formData = new FormData();
      formData.set("email", "test@gmail.com");

      await expect(updateGmailAccount("", formData)).rejects.toThrow("ID akun wajib diisi.");
    });

    it("memperbarui akun dengan enkripsi kredensial baru", async () => {
      const formData = new FormData();
      formData.set("email", "updated@gmail.com");
      formData.set("google_password", "newUpdatedPassword");
      formData.set("backup_codes", "99887766");
      formData.set("status", "Stok Permanen");

      await updateGmailAccount("account-uuid-1", formData);

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
      await updateGmailAccountStatus(
        "account-uuid-1",
        "Diserahkan ke Customer",
        "Serah terima buyer",
      );

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdate.mock.calls[0][0];

      expect(updatePayload.status).toBe("Diserahkan ke Customer");
      expect(updatePayload.notes).toBe("Serah terima buyer");
      expect(updatePayload.managed_by).toBe("admin-user-uuid");
      expect(mockEq).toHaveBeenCalledWith("id", "account-uuid-1");
    });
  });

  describe("deleteGmailAccount", () => {
    it("melempar error jika ID akun tidak ada", async () => {
      await expect(deleteGmailAccount("")).rejects.toThrow("ID akun wajib diisi.");
    });

    it("menghapus akun dengan id yang sesuai", async () => {
      await deleteGmailAccount("account-uuid-to-delete");

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith("id", "account-uuid-to-delete");
    });
  });
});
