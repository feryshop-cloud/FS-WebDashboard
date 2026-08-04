"use client";

import React, { useState } from "react";
import { Copy, Edit, Check, LayoutTemplate, Search, Save, X } from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  type: string;
  preview: string;
  lastUpdated: string;
}

const initialTemplates: TemplateItem[] = [
  {
    id: "TPL-001",
    name: "Template Invoice Penjualan",
    type: "Invoice/Struk",
    preview:
      "Feryshop - Invoice #{ID}\nTanggal: {DATE}\nCustomer: {CUST_NAME}\n-----------------------\nItem: {ITEM_NAME}\nHarga: {PRICE}\nStatus: {STATUS}",
    lastUpdated: "10 Jun 2026",
  },
  {
    id: "TPL-002",
    name: "Format Postingan FB (Ready Stock)",
    type: "Social Media",
    preview:
      "🔥 READY STOCK 🔥\nGame: {CATEGORY}\nAkun: {NAME}\n\nSpek Singkat:\n- \n- \n\n💰 Harga: {PRICE}\nRekber ON. Minat PM/WA!",
    lastUpdated: "12 Jun 2026",
  },
  {
    id: "TPL-003",
    name: "Pesan Broadcast WA - Tagihan DP",
    type: "WhatsApp",
    preview:
      "Halo kak {CUST_NAME}, mengingatkan tagihan untuk akun {ITEM_NAME} sebesar {REMAINING_AMOUNT}. Jatuh tempo hari ini ya kak 🙏",
    lastUpdated: "15 Jun 2026",
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPreview, setEditPreview] = useState("");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (tpl: TemplateItem) => {
    setEditingId(tpl.id);
    setEditPreview(tpl.preview);
  };

  const handleSaveEdit = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              preview: editPreview,
              lastUpdated: new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }
          : t,
      ),
    );
    setEditingId(null);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.preview.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Template</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola format teks untuk postingan, invoice, dan auto-reply chat.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari template..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">{tpl.name}</h2>
                <span className="mt-1 inline-block rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  {tpl.type}
                </span>
              </div>
              <LayoutTemplate className="h-5 w-5 text-slate-300" />
            </div>

            <div className="flex-1 bg-slate-50/30 p-5">
              {editingId === tpl.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editPreview}
                    onChange={(e) => setEditPreview(e.target.value)}
                    rows={6}
                    className="w-full rounded border border-slate-300 p-2 font-mono text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      <X className="h-3 w-3" /> Batal
                    </button>
                    <button
                      onClick={() => handleSaveEdit(tpl.id)}
                      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Save className="h-3 w-3" /> Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                  {tpl.preview}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
              <span className="text-[10px] font-medium text-slate-400">
                Updated: {tpl.lastUpdated}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(tpl.id, tpl.preview)}
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
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
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  title="Edit template"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
