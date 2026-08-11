import { notFound } from "next/navigation";
import { getIncomingEmailById } from "@/app/actions/incoming-emails";
import { EmailDetail } from "./email-detail";

export const dynamic = "force-dynamic";

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = await getIncomingEmailById(id);

  if (!email) {
    notFound();
  }

  return <EmailDetail email={email} />;
}
