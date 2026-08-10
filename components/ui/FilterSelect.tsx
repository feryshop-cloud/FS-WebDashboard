import { ChevronDown, Filter } from "lucide-react";
import { cn } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  withIcon?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  withIcon = true,
  ariaLabel,
  className,
}: FilterSelectProps) {
  return (
    <div
      className={cn(
        "border-border bg-card text-foreground flex items-center gap-2 rounded-lg border px-3 py-2",
        className,
      )}
    >
      {withIcon && <Filter className="text-faint-foreground h-4 w-4 shrink-0" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="text-foreground cursor-pointer bg-transparent text-sm font-medium outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-faint-foreground h-4 w-4 shrink-0" />
    </div>
  );
}