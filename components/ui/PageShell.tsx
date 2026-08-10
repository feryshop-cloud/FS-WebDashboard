import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">{children}</div>;
}
