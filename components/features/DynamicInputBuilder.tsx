"use client";

import React, { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Settings2 } from "lucide-react";

export type DynamicField = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "number" | "password";
  required: boolean;
  regex?: string;
  errorMessage?: string;
};

interface DynamicInputBuilderProps {
  fields: DynamicField[];
  onChange: (fields: DynamicField[]) => void;
}

export function DynamicInputBuilder({ fields, onChange }: DynamicInputBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Temporary Form state for new / editing field
  const [formData, setFormData] = useState<DynamicField>({
    id: "",
    name: "",
    label: "",
    placeholder: "",
    type: "text",
    required: true,
    regex: "",
    errorMessage: "",
  });

  const handleAddField = () => {
    setEditingIndex(null);
    setFormData({
      id: `field_${Date.now()}`,
      name: "",
      label: "",
      placeholder: "",
      type: "text",
      required: true,
      regex: "",
      errorMessage: "",
    });
  };

  const handleSaveField = () => {
    if (!formData.name || !formData.label) {
      alert("Nama Field (ID) dan Label wajib diisi!");
      return;
    }

    const updatedFields = [...fields];
    if (editingIndex !== null) {
      updatedFields[editingIndex] = formData;
    } else {
      updatedFields.push(formData);
    }

    onChange(updatedFields);
    handleAddField(); // reset
  };

  const handleEditField = (index: number) => {
    setEditingIndex(index);
    setFormData(fields[index]);
  };

  const handleDeleteField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange(updatedFields);
    if (editingIndex === index) {
      handleAddField();
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const updatedFields = [...fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[targetIndex];
    updatedFields[targetIndex] = temp;

    onChange(updatedFields);
  };

  // Presets
  const applyPreset = (preset: "mlbb" | "valorant" | "genshin") => {
    if (preset === "mlbb") {
      onChange([
        {
          id: "id",
          name: "id",
          label: "User ID",
          placeholder: "Masukkan User ID",
          type: "text",
          required: true,
          regex: "^[0-9]+$",
          errorMessage: "User ID harus berupa angka",
        },
        {
          id: "server",
          name: "server",
          label: "Zone ID / Server",
          placeholder: "Masukkan Zone ID",
          type: "text",
          required: true,
          regex: "^[0-9]+$",
          errorMessage: "Zone ID harus berupa angka",
        },
      ]);
    } else if (preset === "valorant") {
      onChange([
        {
          id: "id",
          name: "id",
          label: "Riot ID + Tag",
          placeholder: "Contoh: Username#1234",
          type: "text",
          required: true,
        },
      ]);
    } else if (preset === "genshin") {
      onChange([
        {
          id: "id",
          name: "id",
          label: "UID Game",
          placeholder: "Masukkan UID Genshin Impact",
          type: "text",
          required: true,
          regex: "^[0-9]{9}$",
          errorMessage: "UID harus berupa 9 digit angka",
        },
        {
          id: "server",
          name: "server",
          label: "Server",
          placeholder: "Pilih Server",
          type: "text",
          required: true,
        },
      ]);
    }
  };

  return (
    <div className="border-border bg-card space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="border-border-soft flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-blue-600" />
          <h4 className="text-foreground text-sm font-semibold">
            Field Input Dinamis (User Account)
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-faint-foreground text-xs">Preset:</span>
          <button
            type="button"
            onClick={() => applyPreset("mlbb")}
            className="bg-muted text-muted-foreground hover:bg-muted rounded px-2 py-0.5 text-xs"
          >
            MLBB
          </button>
          <button
            type="button"
            onClick={() => applyPreset("valorant")}
            className="bg-muted text-muted-foreground hover:bg-muted rounded px-2 py-0.5 text-xs"
          >
            Valorant
          </button>
        </div>
      </div>

      {/* Field List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-faint-foreground py-2 text-center text-xs italic">
            Belum ada input dinamis yang dikonfigurasi. Menggunakan default (User ID + Server).
          </p>
        ) : (
          fields.map((field, idx) => (
            <div
              key={field.id || idx}
              className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                editingIndex === idx
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-border bg-muted/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">{field.label}</span>
                  <span className="py-0.2 bg-muted text-muted-foreground rounded px-1.5 text-[10px]">
                    key: {field.name || field.id}
                  </span>
                  {field.required && (
                    <span className="py-0.2 rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700">
                      Wajib
                    </span>
                  )}
                </div>
                <span className="text-faint-foreground">
                  Placeholder: &quot;{field.placeholder}&quot;
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0}
                  className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded p-1 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === fields.length - 1}
                  className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded p-1 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditField(idx)}
                  className="rounded px-2 py-1 font-medium text-blue-600 hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteField(idx)}
                  className="rounded p-1 text-rose-500 hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Form */}
      <div className="border-input bg-muted/50 space-y-3 rounded-lg border border-dashed p-3">
        <h5 className="text-foreground text-xs font-semibold">
          {editingIndex !== null
            ? `Edit Field: ${fields[editingIndex].label}`
            : "Tambah Field Baru"}
        </h5>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              ID / Key (e.g. id, server)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                })
              }
              placeholder="e.g. zone_id"
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              Label Tampilan
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Zone ID / Server"
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              Placeholder
            </label>
            <input
              type="text"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="e.g. Masukkan Zone ID"
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              Tipe Field
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as DynamicField["type"] })
              }
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="text">Teks biasa</option>
              <option value="number">Angka saja</option>
              <option value="password">Password/Pin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              Regex Validasi (Opsional)
            </label>
            <input
              type="text"
              value={formData.regex || ""}
              onChange={(e) => setFormData({ ...formData, regex: e.target.value })}
              placeholder="e.g. ^[0-9]+$"
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground block text-[11px] font-medium">
              Pesan Error Validasi
            </label>
            <input
              type="text"
              value={formData.errorMessage || ""}
              onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              placeholder="e.g. Format tidak valid"
              className="border-border bg-card text-foreground w-full rounded border px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="text-foreground flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              className="border-input rounded text-blue-600 focus:ring-blue-500"
            />
            Field Wajib Diisi
          </label>

          <div className="flex items-center gap-1.5">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={handleAddField}
                className="bg-muted text-foreground hover:bg-muted rounded px-2.5 py-1 text-xs font-medium"
              >
                Batal
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveField}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingIndex !== null ? "Simpan Perubahan" : "Tambah ke Daftar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
