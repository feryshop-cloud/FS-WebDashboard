"use client";

import React, { useState, useMemo } from "react";
import { Settings2, Pencil, Check, X, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { updateSiteSetting } from "@/actions/settings";

type SettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

interface SiteSettingsTabProps {
  settings: SettingRow[];
  errorMsg?: string;
  onRefresh: () => void;
}

// Group setting rows by prefix (before first dot)
function groupSettings(settings: SettingRow[]): Record<string, SettingRow[]> {
  const groups: Record<string, SettingRow[]> = {};
  for (const s of settings) {
    const prefix = s.key.includes(".") ? s.key.split(".")[0] : "_other";
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(s);
  }
  return groups;
}

const GROUP_LABELS: Record<string, string> = {
  general: "Umum",
  seo: "SEO & Metadata",
  theme: "Tema",
  social: "Sosial Media",
  footer: "Footer",
  _other: "Lainnya",
};

function valueToDisplay(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseValueInput(raw: string): unknown {
  const trimmed = raw.trim();
  // Try JSON parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // If parse fails, treat as plain string
    return trimmed;
  }
}

function SettingRowItem({
  setting,
  onRefresh,
}: {
  setting: SettingRow;
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(valueToDisplay(setting.value));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleEdit = () => {
    setInputValue(valueToDisplay(setting.value));
    setMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const parsed = parseValueInput(inputValue);
      const res = await updateSiteSetting(setting.key, parsed as never);
      if (res.success) {
        setMessage({ text: "Tersimpan!", ok: true });
        setIsEditing(false);
        onRefresh();
      } else {
        setMessage({ text: res.error || "Gagal menyimpan.", ok: false });
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Terjadi kesalahan.", ok: false });
    } finally {
      setIsSaving(false);
    }
  };

  const displayValue = valueToDisplay(setting.value);
  const isLong = displayValue.length > 60;

  return (
    <div className="group border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-start gap-3">
        {/* Key + Description */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-700">
              {setting.key}
            </code>
            {setting.description && (
              <span className="text-xs text-slate-400">{setting.description}</span>
            )}
          </div>

          {/* Value display / edit */}
          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-2">
                {isLong ? (
                  <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                  />
                )}
                <p className="text-[10px] text-slate-400">
                  Masukkan nilai JSON yang valid (string: tulis biasa, boolean:{" "}
                  <code>true</code>/<code>false</code>, angka: tanpa kutip)
                </p>
              </div>
            ) : (
              <p
                className={`font-mono text-xs ${
                  displayValue.length > 80 ? "line-clamp-2 text-slate-500" : "text-slate-700"
                }`}
              >
                {displayValue}
              </p>
            )}

            {message && (
              <p
                className={`mt-1 text-xs font-medium ${
                  message.ok ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                title="Simpan"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={handleCancel}
                title="Batal"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              title="Edit"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  groupKey,
  rows,
  onRefresh,
}: {
  groupKey: string;
  rows: SettingRow[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(true);
  const label = GROUP_LABELS[groupKey] ?? groupKey.toUpperCase();

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-t-xl px-5 py-3.5 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {rows.length}
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5">
          {rows.map((s) => (
            <SettingRowItem key={s.key} setting={s} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteSettingsTab({ settings, errorMsg, onRefresh }: SiteSettingsTabProps) {
  const groups = useMemo(() => groupSettings(settings), [settings]);

  // Preferred order
  const orderedKeys = ["general", "seo", "theme", "social", "footer", "_other"].filter(
    (k) => groups[k]?.length,
  );
  // Any unrecognized groups not in the order list
  const extraKeys = Object.keys(groups).filter((k) => !orderedKeys.includes(k));
  const allKeys = [...orderedKeys, ...extraKeys];

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {settings.length === 0 && !errorMsg ? (
        <div className="rounded-xl border border-slate-100 bg-white p-12 text-center text-sm text-slate-400">
          Tidak ada data settings di database.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            {settings.length} pengaturan ditemukan. Arahkan kursor ke baris untuk mengedit.
          </p>
          {allKeys.map((groupKey) => (
            <GroupCard
              key={groupKey}
              groupKey={groupKey}
              rows={groups[groupKey]}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
