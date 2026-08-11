"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive, ArchiveRestore, Trash2, Copy, Check } from "lucide-react";
import {
  deleteIncomingEmails,
  setIncomingEmailsArchived,
  type IncomingEmailRow,
} from "@/app/actions/incoming-emails";
import { rowToEmail } from "@/lib/ferrymail";
import { getErrorMessage } from "@/lib/error";

export function EmailDetail({ email }: { email: IncomingEmailRow }) {
  const router = useRouter();
  const view = rowToEmail(email);
  const isOtpEmail = email.category?.toLowerCase().includes("otp") ?? false;
  const [isArchived, setIsArchived] = useState(email.is_archived);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(view.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArchiveToggle = async () => {
    const next = !isArchived;
    setIsArchived(next);
    try {
      await setIncomingEmailsArchived([email.id], next);
    } catch (err) {
      setIsArchived(!next);
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus email dari "${view.sender}"?`)) return;
    try {
      setIsDeleting(true);
      await deleteIncomingEmails([email.id]);
      router.push("/dashboard/mail-list");
    } catch (err) {
      alert(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-border bg-card -mx-8 -my-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden font-sans select-none">
      <div className="bg-card flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
          <Link
            href="/dashboard/mail-list"
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
            aria-label="Kembali ke kotak masuk"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {isArchived ? (
              <button
                onClick={handleArchiveToggle}
                className="hover:bg-muted text-foreground rounded-lg p-1.5 transition-colors"
                title="Keluarkan dari arsip"
              >
                <ArchiveRestore className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleArchiveToggle}
                className="hover:bg-muted text-foreground rounded-lg p-1.5 transition-colors"
                title="Arsipkan email"
              >
                <Archive className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              title="Hapus email"
            >
              <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Subject */}
            <h2 className="text-foreground text-xl font-bold tracking-tight">{view.subject}</h2>

            {/* Sender Details */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${view.avatarBg}`}
              >
                {view.avatarText}
              </div>
              <div>
                <div className="text-foreground text-sm font-bold">{view.sender}</div>
                <div className="text-muted-foreground text-xs font-medium">
                  &lt;{view.senderEmail}&gt;
                </div>
              </div>
              <div className="text-muted-foreground ml-auto text-xs font-semibold">{view.date}</div>
            </div>

            <hr className="border-border" />

            {/* OTP Card — hanya untuk email kategori otp */}
            {isOtpEmail && view.otp && (
              <div className="border-border-soft bg-muted/30 flex items-center justify-between rounded-xl border p-4 shadow-sm">
                <div>
                  <div className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    One-Time Password (OTP)
                  </div>
                  <div className="text-foreground tracking-wides mt-1 font-mono text-2xl font-black">
                    {view.otp}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 ${
                    copied
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                  title="Salin kode OTP"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* Message Body */}
            <div className="text-foreground text-sm leading-relaxed font-semibold whitespace-pre-line">
              {view.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
