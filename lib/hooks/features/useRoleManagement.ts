import { useState, useTransition } from "react";
import { updateRolePermissions, createRole, deleteRole } from "@/actions/settings";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions?: unknown;
};

export function useRoleManagement(initialRoles: Role[], onRefresh: () => void) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRoles[0] || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Modal State for New Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [, startTransition] = useTransition();

  const activePermissions: Record<string, boolean> =
    typeof selectedRole?.permissions === "object" && selectedRole?.permissions !== null
      ? (selectedRole.permissions as Record<string, boolean>)
      : {};

  const handleTogglePermission = (key: string) => {
    if (!selectedRole) return;
    const updated = {
      ...activePermissions,
      [key]: !activePermissions[key],
    };
    setSelectedRole({
      ...selectedRole,
      permissions: updated,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSaving(true);
      setSaveMessage("");
      const res = await updateRolePermissions(selectedRole.id, activePermissions);

      if (res.success) {
        setSaveMessage("Hak akses berhasil disimpan!");
        onRefresh();
      } else {
        setSaveMessage(res.error || "Gagal menyimpan hak akses.");
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = () => {
    if (isModalClosing) return;
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isModalClosing || isCreating) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalClosing(false);
      setIsModalOpen(false);
    }, 200);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newRoleName.trim()) {
      setFormError("Nama role wajib diisi.");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createRole(newRoleName, newRoleDesc);
      if (!res.success) {
        setFormError(res.error || "Gagal membuat role.");
        return;
      }

      setNewRoleName("");
      setNewRoleDesc("");
      onRefresh();
      closeModal();
    } catch (err) {
      console.error(err);
      setFormError("Gagal membuat role baru.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role ${roleName}?`)) return;

    try {
      const res = await deleteRole(roleId);
      if (!res.success) {
        setSaveMessage(res.error || "Gagal menghapus role.");
        return;
      }

      if (selectedRole?.id === roleId) {
        setSelectedRole(initialRoles.find((r) => r.id !== roleId) || null);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    uiState: {
      selectedRole,
      isSaving,
      saveMessage,
      isModalOpen,
      isModalClosing,
      isCreating,
      formError,
      newRoleName,
      newRoleDesc,
      activePermissions,
    },
    actions: {
      setSelectedRole,
      setSaveMessage,
      setIsModalOpen,
      setNewRoleName,
      setNewRoleDesc,
      handleTogglePermission,
      handleSavePermissions: () => startTransition(() => handleSavePermissions()),
      openModal,
      closeModal,
      handleCreateRole,
      handleDeleteRole,
    },
  };
}
