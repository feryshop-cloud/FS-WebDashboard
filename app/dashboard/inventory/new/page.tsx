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
          className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground rounded-[10px] border p-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Add New Account</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Input details for the newly acquired inventory.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="border-border bg-card rounded-[10px] border p-8">
        <AddInventoryForm games={games || []} />
      </div>
    </div>
  );
}
