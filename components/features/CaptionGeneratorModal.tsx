"use client";

import { useState, useEffect } from "react";
import { getInventoryForCaption } from "@/app/actions/templates";
import { updateItemStatus } from "@/actions/inventory";
import { Copy, Check, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { TemplateItem } from "@/lib/hooks/features/useTemplates";

interface InventoryCaptionItem {
  id: string;
  public_id?: string | null;
  title_reference?: string | null;
  account_specs?: string | null;
  asking_price: number;
  status: string;
  games?: { name: string } | null;
}

export function CaptionGeneratorModal({
  templates,
  isOpen,
  onClose,
  initialItem = null,
}: {
  templates: TemplateItem[];
  isOpen: boolean;
  onClose: () => void;
  initialItem?: InventoryCaptionItem | null;
}) {
  const [inventoryList, setInventoryList] = useState<InventoryCaptionItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [activeTemplateIdx, setActiveTemplateIdx] = useState<number>(0);

  const [copied, setCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filter templates to Social Media / Marketing type
  const socialTemplates = templates.filter(
    (t) =>
      t.type.toLowerCase().includes("social") ||
      t.type.toLowerCase().includes("media") ||
      t.type === "Marketing" ||
      true,
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchInventory = async () => {
      setIsLoadingInventory(true);
      try {
        const data = (await getInventoryForCaption()) as unknown as InventoryCaptionItem[];
        setInventoryList(data);
        if (initialItem) {
          setSelectedInventoryId(initialItem.id);
        } else if (data.length > 0) {
          setSelectedInventoryId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load inventory for caption", err);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const selectedItem = inventoryList.find((item) => item.id === selectedInventoryId) || initialItem;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Template-based string interpolation helper
  const interpolateCaption = (content: string, item: InventoryCaptionItem | null): string => {
    if (!item) return content;

    const refCode = item.title_reference || item.public_id || "REF-000";
    const gameName = item.games?.name || "Game";
    const priceFormatted = formatCurrency(item.asking_price);

    const variables: Record<string, string> = {
      game_name: gameName,
      account_specs: item.account_specs || "",
      asking_price: priceFormatted,
      ref_code: refCode,
      public_id: item.public_id || refCode,
      status: item.status,
    };

    let result = content;
    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
      result = result.replace(regex, val);
    });

    return result;
  };

  const activeTemplate = socialTemplates[activeTemplateIdx] || socialTemplates[0];
  const finalCaptionText =
    activeTemplate && selectedItem
      ? interpolateCaption(activeTemplate.content, selectedItem)
      : selectedItem
        ? `[${selectedItem.games?.name || "Game"}] Account Available!\nRef: ${selectedItem.title_reference || selectedItem.public_id}\n\nSpesifikasi:\n${selectedItem.account_specs}\n\nHarga: ${formatCurrency(selectedItem.asking_price)}\n\nMinat? Hubungi Admin SEKARANG!`
        : "Pilih akun inventori terlebih dahulu.";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalCaptionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy caption", err);
    }
  };

  const handleMarkAvailable = async () => {
    if (!selectedItem || selectedItem.status === "AVAILABLE") return;
    setIsUpdatingStatus(true);
    try {
      await updateItemStatus(selectedItem.id, "AVAILABLE");
      // Update local state status
      setInventoryList((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, status: "AVAILABLE" } : i)),
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 border-border bg-card flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-xl">
        {/* Header */}
        <div className="border-border bg-muted/50 flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                Automated Static Caption Generator
              </h2>
              <p className="text-muted-foreground text-xs">
                Pilih akun & template postingan Instagram / Social Media
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-faint-foreground hover:bg-muted hover:text-muted-foreground tap-large rounded-[10px] p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Inventory Item Selector */}
          <div className="space-y-1.5">
            <label className="text-foreground block text-xs font-semibold tracking-wider uppercase">
              Pilih Akun Game Inventori
            </label>
            {isLoadingInventory ? (
              <div className="border-border bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Memuat daftar stok akun...
              </div>
            ) : inventoryList.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Tidak ada stok akun aktif dengan status UNPOSTED / AVAILABLE.
              </div>
            ) : (
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {inventoryList.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    [{inv.games?.name || "Game"}]{" "}
                    {inv.title_reference || inv.public_id || "Tanpa Ref"} —{" "}
                    {formatCurrency(inv.asking_price)} ({inv.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Template Selection Tabs */}
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                Pilih Template Postingan
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {templates.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveTemplateIdx(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                      activeTemplateIdx === idx
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border"
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Output Caption Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                Hasil Interpolasi Caption
              </label>
              <span className="text-muted-foreground text-[11px]">
                Presisi static template • Zero AI
              </span>
            </div>
            <div className="border-border bg-muted/40 text-foreground relative min-h-[140px] rounded-xl border p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all">
              {finalCaptionText}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:px-6">
          {selectedItem && selectedItem.status === "UNPOSTED" ? (
            <button
              onClick={handleMarkAvailable}
              disabled={isUpdatingStatus}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
            >
              {isUpdatingStatus ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Tandai Status TERSEDIA
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-medium transition-colors active:scale-95"
            >
              Tutup
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  Tersalin ke Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin Caption Instagram
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
