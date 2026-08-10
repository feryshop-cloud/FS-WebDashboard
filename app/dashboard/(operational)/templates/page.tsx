"use client";

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
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/features/useTemplates";

export default function TemplatesPage() {
  const {
    data: { filteredTemplates },
    isLoading,
    isSubmitting,
    uiState: {
      search,
      copiedId,
      isAddOpen,
      isAddClosing,
      editingId,
      editContent,
      editName,
      editType,
    },
    actions: {
      setSearch,
      openAdd,
      closeModal,
      handleAddSubmit,
      handleStartEdit,
      handleSaveEdit,
      handleDelete,
      setEditContent,
      setEditName,
      setEditType,
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
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.97] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Template
        </button>
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

      {/* Grid of Templates */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                {editingId === tpl.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama Template"
                      className="border-input text-foreground w-full rounded border p-2 text-xs font-bold outline-none focus:border-blue-500"
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="border-input text-foreground w-full rounded border p-2 text-xs outline-none focus:border-blue-500"
                    >
                      <option value="Social Media">Social Media</option>
                      <option value="Invoice/Struk">Invoice/Struk</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="border-input text-foreground w-full rounded border p-2 font-mono text-xs outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSaveEdit(tpl.id)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="text-muted-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {tpl.content}
                  </pre>
                )}
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
                    onClick={() => handleStartEdit(tpl)}
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

      {/* Add Modal */}
      {(isAddOpen || isAddClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Tambah Template Baru</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Buat format teks baru untuk postingan, invoice, atau chat.
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
              onSubmit={handleAddSubmit}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Nama Template
                  </label>
                  <input
                    name="name"
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
                    name="type"
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
                    name="content"
                    required
                    rows={5}
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
                        <span>Simpan Template</span>
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
    </>
  );
}
