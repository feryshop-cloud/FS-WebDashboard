import { Search } from "lucide-react";
import { cn } from "./cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  accent?: "blue" | "slate";
}

const ACCENT_FOCUS: Record<string, string> = {
  blue: "focus:border-blue-500 focus:ring-blue-500/20",
  slate: "focus:border-blue-500 focus:ring-blue-500/20",
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  accent = "slate",
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full sm:w-96", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="text-faint-foreground h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          "border-border bg-muted text-foreground placeholder-placeholder block w-full rounded-lg border py-2 pr-3 pl-10 transition-all outline-none focus:ring-2 sm:text-sm",
          ACCENT_FOCUS[accent],
        )}
      />
    </div>
  );
}
