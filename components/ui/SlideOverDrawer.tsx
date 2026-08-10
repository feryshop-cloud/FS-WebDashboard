import { ReactNode, Ref } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

interface SlideOverDrawerProps {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  labelledById?: string;
  drawerRef?: Ref<HTMLDivElement>;
  children: ReactNode;
  headerClassName?: string;
  closeButtonClassName?: string;
  overlayClassName?: string;
}

export function SlideOverDrawer({
  open,
  closing,
  onClose,
  title,
  subtitle,
  labelledById,
  drawerRef,
  children,
  headerClassName,
  closeButtonClassName,
  overlayClassName,
}: SlideOverDrawerProps) {
  if (!open && !closing) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm",
        closing ? "fs-overlay-out" : "fs-overlay-in",
        overlayClassName,
      )}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-card flex h-full w-full max-w-md flex-col shadow-2xl",
          closing ? "fs-drawer-out" : "fs-drawer-in",
        )}
      >
        <div
          className={cn(
            "border-border-soft flex items-center justify-between border-b px-6 py-5",
            headerClassName ?? "bg-muted",
          )}
        >
          <div>
            <div id={labelledById} className="text-foreground text-lg font-bold">
              {title}
            </div>
            {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={cn(
              "bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors",
              closeButtonClassName,
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
