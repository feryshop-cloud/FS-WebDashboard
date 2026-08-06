"use client";

import Link from "next/link";

interface GameCategory {
  id: string;
  name: string;
  slug: string;
  activeCount: number;
}

export function GameCategoryGrid({ categories }: { categories: GameCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          href={`/dashboard/inventory/category/${category.slug}`}
          key={category.id}
          className="group relative rounded-[10px] border border-border bg-card p-4 transition-colors duration-200 hover:bg-muted"
        >
          {/* Image Frame */}
          <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-[10px] border border-border bg-muted transition-colors group-hover:border-input">
            <span className="text-xs text-faint-foreground">Bingkai Gambar</span>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm leading-tight font-semibold text-foreground">{category.name}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-[10px] border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {category.activeCount} siap jual
              </span>
            </div>
          </div>

          {/* Decorative dot */}
          <div
            className={`absolute top-4 right-4 h-2 w-2 rounded-[10px] ${category.activeCount > 0 ? "bg-emerald-400" : "bg-muted"} `}
          />
        </Link>
      ))}
    </div>
  );
}
