import { createClient } from "../../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InventoryTable } from "../../../../../components/features/InventoryTable";
import type { InventoryItemWithGame } from "../../../../../types/database";

export const dynamic = "force-dynamic";

export default async function GameCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch game details
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (gameError || !game) {
    redirect("/dashboard/inventory");
  }

  // 2. Fetch inventory for this game
  const { data: inventory, error: invError } = await supabase
    .from("inventory")
    .select(
      `
      *,
      games (
        name,
        slug
      )
    `,
    )
    .eq("game_id", game.id)
    .order("created_at", { ascending: false });

  const items = (inventory as unknown as InventoryItemWithGame[]) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Top Bar */}
      <div>
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Stok Akun: {game.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Menampilkan {items.length} akun jualan untuk game ini.
          </p>
        </div>
      </div>

      {/* Error state */}
      {invError && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load inventory: {invError.message}
        </div>
      )}

      {/* Content */}
      <section>
        <InventoryTable inventory={items} />
      </section>
    </div>
  );
}
