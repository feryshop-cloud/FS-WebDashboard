import { createClient } from "@/lib/supabase/server";
import { AddInventoryForm } from "@/components/features/AddInventoryForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AddInventoryPage() {
  const supabase = await createClient();

  // Fetch games for the dropdown
  const { data: games } = await supabase.from("games").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/inventory"
          className="rounded-[10px] border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add New Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Input details for the newly acquired inventory.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="rounded-[10px] border border-border bg-card p-8">
        <AddInventoryForm games={games || []} />
      </div>
    </div>
  );
}
