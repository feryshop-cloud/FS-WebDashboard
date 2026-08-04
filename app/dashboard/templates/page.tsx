"use client";

import React, { useState, useEffect } from "react";
import { Copy, Edit, Check, LayoutTemplate, Search, Save, X, Plus, Trash2, Loader2 } from "lucide-react";
import { getTemplates, addTemplate, updateTemplate, deleteTemplate } from "@/app/actions/templates";

interface TemplateItem {
  id: string;
  name: string;
  type: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");

  const loadTemplatesData = async () => {
    try {
      setIsLoading(true);
      const data = await getTemplates();
      setTemplates(data as unknown as TemplateItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getTemplates()
      .then((data) => {
        if (isMounted) {
          setTemplates(data as unknown as TemplateItem[]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);
      await addTemplate(formData);
      setIsAddOpen(false);
      loadTemplatesData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tpl: TemplateItem) => {
    setEditingId(tpl.id);
    setEditName(tpl.name);
    setEditType(tpl.type);
    setEditContent(tpl.content);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("type", editType);
      formData.append("content", editContent);

      await updateTemplate(id, formData);
      setEditingId(null);
      loadTemplatesData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return;
    try {
      await deleteTemplate(id);
      loadTemplatesData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()),
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
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Template
        </button>
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
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
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama Template"
                      className="w-full rounded border border-slate-300 p-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-blue-500"
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
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                    {tpl.content}
                  </pre>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
                <span className="text-[10px] font-medium text-slate-400">
                  ID: {tpl.id.slice(0, 8)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(tpl.id, tpl.content)}
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
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Template Baru</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Template</label>
                <input
                  name="name"
                  required
                  placeholder="Mis. Template Postingan MLBB"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Kategori / Tipe</label>
                <select
                  name="type"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Social Media">Social Media</option>
                  <option value="Invoice/Struk">Invoice/Struk</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Isi Teks Template</label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  placeholder="Format teks..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
