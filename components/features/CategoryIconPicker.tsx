"use client";

import { useState } from "react";
import {
  Gamepad2,
  Sword,
  Gem,
  Trophy,
  Coins,
  Crown,
  Zap,
  Flame,
  Sparkles,
  Shield,
  Target,
  Crosshair,
  Rocket,
  Gift,
  Package,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Store,
  Ticket,
  Medal,
  Star,
  Ghost,
  Skull,
  Droplets,
  Fish,
  PawPrint,
  Banknote,
  Wallet,
  CreditCard,
  BadgeDollarSign,
  Heart,
  Map,
  Compass,
  Mountain,
  Plane,
  Car,
  Bike,
  Music,
  Camera,
  Film,
  BookOpen,
  Key,
  Check,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

export interface CategoryIconDef {
  name: string;
  component: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIconDef[] = [
  { name: "Gamepad2", component: Gamepad2 },
  { name: "Sword", component: Sword },
  { name: "Gem", component: Gem },
  { name: "Trophy", component: Trophy },
  { name: "Coins", component: Coins },
  { name: "Crown", component: Crown },
  { name: "Zap", component: Zap },
  { name: "Flame", component: Flame },
  { name: "Sparkles", component: Sparkles },
  { name: "Shield", component: Shield },
  { name: "Target", component: Target },
  { name: "Crosshair", component: Crosshair },
  { name: "Rocket", component: Rocket },
  { name: "Gift", component: Gift },
  { name: "Package", component: Package },
  { name: "Boxes", component: Boxes },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Store", component: Store },
  { name: "Ticket", component: Ticket },
  { name: "Medal", component: Medal },
  { name: "Star", component: Star },
  { name: "Ghost", component: Ghost },
  { name: "Skull", component: Skull },
  { name: "Droplets", component: Droplets },
  { name: "Fish", component: Fish },
  { name: "PawPrint", component: PawPrint },
  { name: "Banknote", component: Banknote },
  { name: "Wallet", component: Wallet },
  { name: "CreditCard", component: CreditCard },
  { name: "BadgeDollarSign", component: BadgeDollarSign },
  { name: "Heart", component: Heart },
  { name: "Map", component: Map },
  { name: "Compass", component: Compass },
  { name: "Mountain", component: Mountain },
  { name: "Plane", component: Plane },
  { name: "Car", component: Car },
  { name: "Bike", component: Bike },
  { name: "Music", component: Music },
  { name: "Camera", component: Camera },
  { name: "Film", component: Film },
  { name: "BookOpen", component: BookOpen },
  { name: "Key", component: Key },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICONS.map((i) => [i.name, i.component]),
);

export const LUCIDE_PREFIX = "lucide:";

export function isLucideLogo(logo?: string | null): boolean {
  return typeof logo === "string" && logo.startsWith(LUCIDE_PREFIX);
}

export function lucideIconName(logo?: string | null): string | null {
  if (!isLucideLogo(logo)) return null;
  const name = logo!.slice(LUCIDE_PREFIX.length);
  return name in ICON_MAP ? name : null;
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function CategoryIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-sm font-medium">Logo / Icon (Opsional)</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="border-border bg-muted text-foreground flex w-full items-center justify-between rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
      >
        <span className="flex items-center gap-2">
          {value ? (
            <>
              <CategoryIcon name={value} className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{value}</span>
            </>
          ) : (
            <span className="text-faint-foreground">Pilih ikon...</span>
          )}
        </span>
        <ChevronDown
          className={`text-faint-foreground h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-border bg-card max-h-56 overflow-y-auto rounded-[10px] border p-2 shadow-sm">
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
            {CATEGORY_ICONS.map((icon) => {
              const Icon = icon.component;
              const selected = value === icon.name;
              return (
                <button
                  key={icon.name}
                  type="button"
                  title={icon.name}
                  onClick={() => {
                    onChange(icon.name);
                    setOpen(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                  }`}
                >
                  {selected ? <Check className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
