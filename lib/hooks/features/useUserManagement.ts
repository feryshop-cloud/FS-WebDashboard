"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { updateUserRole, toggleUserStatus, createAdminUser } from "@/actions/settings";

export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type UserRecord = {
  id: string;
  full_name: string;
  email?: string | null;
  status: string | null;
  role_id: string | null;
  created_at: string;
  roles?: { id: string; name: string; description: string | null } | null;
};

export type CreatedUserInfo = {
  full_name: string;
  email: string;
  generatedPassword?: string;
};

function generatePassword(length = 12): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const all = lower + upper + digits;

  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);

  const chars = Array.from(buf, (b) => all[b % all.length]);
  chars[0] = lower[buf[0] % lower.length];
  chars[1] = upper[buf[1] % upper.length];
  chars[2] = digits[buf[2] % digits.length];

  for (let i = length - 1; i > 0; i--) {
    const j = buf[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function useUserManagement(users: UserRecord[], onRefresh: () => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [createdUser, setCreatedUser] = useState<CreatedUserInfo | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement !== searchInputRef.current
      ) {
        const isInputOrTextarea = ["INPUT", "TEXTAREA"].includes(
          (document.activeElement?.tagName || "").toUpperCase(),
        );
        if (!isInputOrTextarea) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const queryLower = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!queryLower) return true;
      return (
        u.full_name?.toLowerCase().includes(queryLower) ||
        u.email?.toLowerCase().includes(queryLower) ||
        u.id?.toLowerCase().includes(queryLower) ||
        u.roles?.name?.toLowerCase().includes(queryLower) ||
        u.status?.toLowerCase().includes(queryLower)
      );
    });
  }, [users, queryLower]);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setActionError("");
    try {
      setUpdatingUserId(userId);
      const res = await updateUserRole(userId, newRoleId);
      if (res && !res.success) {
        setActionError(res.error || "Gagal mengubah role pengguna.");
        return;
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError("Gagal mengubah role pengguna.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string | null) => {
    setActionError("");
    try {
      setUpdatingUserId(userId);
      const res = await toggleUserStatus(userId, currentStatus || "ACTIVE");
      if (res && !res.success) {
        setActionError(res.error || "Gagal mengubah status pengguna.");
        return;
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError("Gagal mengubah status pengguna.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const closeModal = () => {
    if (isModalClosing || isCreating) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalClosing(false);
      setIsModalOpen(false);
      setFormError("");
      setCreatedUser(null);
      setForm({ email: "", password: "", full_name: "", role_id: "" });
    }, 200);
  };

  const openModal = () => {
    if (isModalClosing) return;
    setFormError("");
    setCreatedUser(null);
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    setForm((prev) => ({ ...prev, password: generatePassword() }));
  };

  const handleCopyPassword = async () => {
    if (!createdUser?.generatedPassword) return;
    try {
      await navigator.clipboard.writeText(createdUser.generatedPassword);
    } catch {
      // clipboard unavailable, ignore
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.email || !form.full_name) {
      setFormError("Email dan nama lengkap wajib diisi. Password boleh dikosongkan untuk digenerate otomatis.");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createAdminUser(
        form.email,
        form.password,
        form.full_name,
        form.role_id || null,
      );
      if (res.success) {
        const generatedPassword =
          "generatedPassword" in res ? res.generatedPassword : undefined;
        setCreatedUser({
          full_name: form.full_name,
          email: form.email,
          ...(generatedPassword ? { generatedPassword } : {}),
        });
        setForm({ email: "", password: "", full_name: "", role_id: "" });
        onRefresh();
      } else {
        setFormError(res.error || "Gagal membuat pengguna.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan saat membuat pengguna.");
    } finally {
      setIsCreating(false);
    }
  };

  return {
    data: {
      filteredUsers,
    },
    isCreating,
    updatingUserId,
    formError,
    actionError,
    createdUser,
    uiState: {
      searchQuery,
      isModalOpen,
      isModalClosing,
      form,
    },
    refs: {
      searchInputRef,
    },
    actions: {
      setSearchQuery,
      setForm,
      openModal,
      closeModal,
      handleRoleChange,
      handleToggleStatus,
      handleCreateUser,
      handleGeneratePassword,
      handleCopyPassword,
    },
  };
}
