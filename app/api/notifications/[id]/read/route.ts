import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { id } = await params;
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: notification } = await supabase
    .from("notifications")
    .select("read_by")
    .eq("id", id)
    .single();

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const readBy = notification.read_by || [];
  if (!readBy.includes(userId)) {
    readBy.push(userId);
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_by: readBy })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
