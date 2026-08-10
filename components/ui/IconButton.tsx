import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "./cn";

type IconButtonTone = "blue" | "rose" | "emerald" | "faint" | "neutral";

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  size?: number;
  tone?: IconButtonTone;
  className?: string;
}

const TONE_CLASS: Record<IconButtonTone, string> = {
  blue: "text-blue-500 hover:bg-blue-50 hover:text-blue-700",
  rose: "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
  emerald: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
  faint: "text-faint-foreground hover:bg-muted hover:text-muted-foreground",
  neutral: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function IconButton({
  icon: Icon,
  onClick,
  title,
  ariaLabel,
  disabled,
  isLoading,
  size = 16,
  tone = "neutral",
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        "tap-large rounded-[10px] p-1.5 transition-colors disabled:opacity-50",
        TONE_CLASS[tone],
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      ) : (
        <Icon style={{ width: size, height: size }} />
      )}
    </button>
  );
}
