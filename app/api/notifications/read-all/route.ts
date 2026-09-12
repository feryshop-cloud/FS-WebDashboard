import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function PATCH(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, read_by")
    .not("read_by", "cs", `{${userId}}`);

  if (notifications && notifications.length > 0) {
    for (const n of notifications) {
      const readBy = n.read_by || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await supabase
          .from("notifications")
          .update({ read_by: readBy })
          .eq("id", n.id);
      }
    }
  }

  return NextResponse.json({ success: true });
}
