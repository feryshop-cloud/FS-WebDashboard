import { ReactNode } from "react";
import { PageShell } from "@/components/ui/PageShell";

export default function OperationalLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
