"use client";
import { useState } from "react";

import React from "react";
import {
  Copy,
  Edit,
  Check,
  LayoutTemplate,
  Search,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/features/useTemplates";
import { CaptionGeneratorModal } from "@/components/features/CaptionGeneratorModal";

const PLACEHOLDERS = [
  { key: "{{game_name}}", desc: "Nama kategori game", example: "Mobile Legends" },
  { key: "{{account_specs}}", desc: "Spesifikasi lengkap akun", example: "Mythic III, 80 Skin, WR 62%" },
  { key: "{{asking_price}}", desc: "Harga jual (format Rupiah)", example: "Rp 1.500.000" },
  { key: "{{ref_code}}", desc: "Kode referensi unik stok", example: "ML-0001-MYTHIC-III" },
  { key: "{{public_id}}", desc: "ID publik stok otomatis", example: "ML-0001" },
  { key: "{{status}}", desc: "Status stok saat ini", example: "UNPOSTED" },
];

export default function TemplatesPage() {
  const [showPlaceholderHelp, setShowPlaceholderHelp] = useState(false);
  const {
    data: { templates, filteredTemplates },
    isLoading,
    isSubmitting,
    uiState: {
      search,
      copiedId,
      isModalOpen,
      isModalClosing,
      isCaptionModalOpen,
      editingTemplate,
      form,
    },
    actions: {
      setSearch,
      openAdd,
      openEdit,
      closeModal,
      openCaptionModal,
      closeCaptionModal,
      setFormField,
      handleFormSubmit,
      handleDelete,
      handleCopy,
    },
  } = useTemplates();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Manajemen Template</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola format teks untuk postingan, invoice, dan auto-reply chat.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCaptionModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            Generate Caption
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Tambah Template
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="text-faint-foreground absolute top-2.5 left-3 h-4 w-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari template..."
          className="border-border bg-card w-full rounded-lg border py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Placeholder Reference Tutorial */}
      <div className="border-border rounded-xl border">
        <button
          type="button"
          onClick={() => setShowPlaceholderHelp((v) => !v)}
          className="text-foreground flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/50 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Panduan Placeholder Template Caption
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              showPlaceholderHelp ? "rotate-180" : ""
            }`}
          />
        </button>

        {showPlaceholderHelp && (
          <div className="border-border border-t px-4 pb-4 pt-3">
            <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
              Tulis isi template menggunakan <strong className="text-foreground font-mono">&#123;&#123;variable&#125;&#125;</strong> sebagai
              placeholder. Saat admin menekan <strong>Generate Caption</strong> dan memilih akun stok, semua
              placeholder akan otomatis diisi dengan data akun tersebut.
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Placeholder</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Keterangan</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Contoh Output</th>
                  </tr>
                </thead>
                <tbody>
                  {PLACEHOLDERS.map((p) => (
                    <tr key={p.key} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2">
                        <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {p.key}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.desc}</td>
                      <td className="px-3 py-2 text-muted-foreground italic">{p.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Contoh Isi Template</p>
              <pre className="font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">{
`🔥 READY STOCK {{game_name}} 🔥

Ref: {{ref_code}}

📋 Spesifikasi:
{{account_specs}}

💰 Harga: {{asking_price}}

✅ DM Admin untuk info lebih lanjut!`
              }</pre>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Templates / Shimmer / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="border-border-soft bg-card flex flex-col overflow-hidden rounded-xl border p-0 shadow-sm"
            >
              <div className="border-border-soft bg-muted/40 flex items-center justify-between border-b px-5 py-4">
                <div className="space-y-2">
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                </div>
                <div className="bg-muted h-5 w-5 animate-pulse rounded-full" />
              </div>
              <div className="bg-muted/20 flex-1 space-y-2 p-5">
                <div className="bg-muted h-3 w-full animate-pulse rounded" />
                <div className="bg-muted h-3 w-5/6 animate-pulse rounded" />
                <div className="bg-muted h-3 w-4/6 animate-pulse rounded" />
                <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
              </div>
              <div className="border-border-soft bg-card flex items-center justify-between border-t px-5 py-3">
                <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="bg-muted h-6 w-6 animate-pulse rounded" />
                  <div className="bg-muted h-6 w-6 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="border-border-soft bg-card text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border py-16 text-center text-sm shadow-sm">
          <LayoutTemplate className="text-faint-foreground h-10 w-10 opacity-40" />
          <p className="text-foreground font-semibold">Belum ada template</p>
          <p className="text-muted-foreground max-w-sm text-xs">
            {search
              ? "Tidak ada template yang cocok dengan kata kunci pencarian Anda."
              : "Buat format teks baru untuk postingan social media, invoice, atau auto-reply WhatsApp."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="border-border-soft bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm"
            >
              <div className="border-border-soft bg-muted/50 flex items-start justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-foreground text-sm font-bold">{tpl.name}</h2>
                  <span className="mt-1 inline-block rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    {tpl.type}
                  </span>
                </div>
                <LayoutTemplate className="text-faint-foreground h-5 w-5" />
              </div>

              <div className="bg-muted/30 flex-1 p-5">
                <pre className="text-muted-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {tpl.content}
                </pre>
              </div>

              <div className="border-border-soft bg-card flex items-center justify-between border-t px-5 py-3">
                <span className="text-faint-foreground text-[10px] font-medium">
                  ID: {tpl.id.slice(0, 8)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(tpl.id, tpl.content)}
                    className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    title="Copy to clipboard"
                  >
                    {copiedId === tpl.id ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(tpl)}
                    className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                    title="Edit template"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                    title="Hapus template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Drawer Modal */}
      {(isModalOpen || isModalClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isModalClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isModalClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">
                  {editingTemplate !== null ? "Edit Template" : "Tambah Template Baru"}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editingTemplate !== null
                    ? "Ubah pengisian format teks template."
                    : "Buat format teks baru untuk postingan, invoice, atau chat."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={handleFormSubmit}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Nama Template
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setFormField("name", e.target.value)}
                    required
                    placeholder="Mis. Template Postingan MLBB"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Kategori / Tipe
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setFormField("type", e.target.value)}
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="Invoice/Struk">Invoice/Struk</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Isi Teks Template
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setFormField("content", e.target.value)}
                    required
                    rows={8}
                    placeholder="Format teks..."
                    className="border-border w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="border-border-soft bg-card border-t p-6">
                <div className="flex w-full flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>
                          {editingTemplate !== null ? "Simpan Perubahan" : "Simpan Template"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Static Caption Generator Modal */}
      <CaptionGeneratorModal
        templates={templates}
        isOpen={isCaptionModalOpen}
        onClose={closeCaptionModal}
      />
    </>
  );
}
