import { ReactNode, Ref } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "./cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  dialogRef?: Ref<HTMLDivElement>;
  labelledById?: string;
  describedById?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  isConfirming,
  error,
  onConfirm,
  onCancel,
  dialogRef,
  labelledById,
  describedById,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      aria-describedby={describedById}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="border-border bg-card w-full max-w-sm rounded-xl border p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-rose-600">
          <div className="rounded-full bg-rose-50 p-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 id={labelledById} className="text-foreground text-lg font-bold">
            {title}
          </h3>
        </div>
        <div id={describedById} className="text-muted-foreground mb-4 text-sm">
          {description}
        </div>
        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-xs font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50",
              "bg-rose-600 hover:bg-rose-700",
            )}
          >
            {isConfirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isConfirming ? "Menghapus..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
