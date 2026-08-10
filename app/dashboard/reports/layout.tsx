import { ReactNode } from "react";
import { PageShell } from "@/components/ui/PageShell";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
