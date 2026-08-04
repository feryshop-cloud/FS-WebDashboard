"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

type ProblemCaseInsert = Database["public"]["Tables"]["problem_cases"]["Insert"];

export async function getProblemCases() {
  return runAction("getProblemCases", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("problem_cases")
      .select(
        `
          *,
          deals (deal_number),
          stocks (sku, name),
          customers (name)
        `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching problem cases", { error });
      return [];
    }
    return data;
  });
}

export async function createProblemCase(formData: FormData) {
  return runAction("createProblemCase", async () => {
    const supabase = await createClient();

    const issue_type = formData.get("issue_type")?.toString();
    const status = formData.get("status")?.toString() || "Open";
    const chronology = formData.get("chronology")?.toString();
    const related_type = formData.get("related_type")?.toString();
    const related_id = formData.get("related_id")?.toString();

    if (!issue_type) {
      throw new Error("Issue type is required");
    }

    // Auto-generate case number
    const prefix = "CASE-";
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM

    const { data: latestCase } = await supabase
      .from("problem_cases")
      .select("case_number")
      .like("case_number", `${prefix}${dateStr}-%`)
      .order("case_number", { ascending: false })
      .limit(1);

    let seq = 1;
    if (latestCase && latestCase.length > 0) {
      const lastNum = parseInt(latestCase[0].case_number.split("-")[2]);
      if (!isNaN(lastNum)) seq = lastNum + 1;
    }
    const case_number = `${prefix}${dateStr}-${seq.toString().padStart(3, "0")}`;

    const payload: ProblemCaseInsert = {
      case_number,
      issue_type,
      status,
      chronology,
    };

    if (related_type === "DEAL" && related_id) {
      payload.deal_id = related_id;
      // Auto-fetch customer_id from deal if possible
      const { data: deal } = await supabase
        .from("deals")
        .select("customer_id")
        .eq("id", related_id)
        .single();
      if (deal) payload.customer_id = deal.customer_id;
    } else if (related_type === "STOCK" && related_id) {
      payload.stock_id = related_id;
    }

    const { error } = await supabase.from("problem_cases").insert([payload]);

    if (error) {
      throw new Error("Failed to create problem case: " + error.message);
    }

    // Also log to audit
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("audit_logs").insert([
        {
          user_id: userData.user.id,
          module: "Akun Bermasalah",
          action: "CREATE",
          description: `Membuat tiket problem case baru: ${case_number} (${issue_type})`,
        },
      ]);
    }

    revalidatePath("/dashboard/problem-cases");
  });
}