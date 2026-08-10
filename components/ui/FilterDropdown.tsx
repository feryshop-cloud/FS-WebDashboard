import { useState, useRef, useEffect } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "./cn";

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: FilterDropdownOption[];
  label?: string;
  withIcon?: boolean;
  ariaLabel?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

export function FilterDropdown({
  value,
  onSelect,
  options,
  label,
  withIcon = true,
  ariaLabel,
  buttonClassName,
  menuClassName,
  align = "right",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const displayLabel = label ?? options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-35 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto",
          buttonClassName,
        )}
      >
        <span className="flex items-center gap-2">
          {withIcon && <Filter className="text-faint-foreground h-4 w-4 shrink-0" />}
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            "text-faint-foreground h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            "fs-drop-in border-border-soft bg-card absolute top-full z-20 mt-2 w-48 rounded-xl border py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm",
                  isSelected
                    ? "bg-muted text-foreground font-semibold"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}