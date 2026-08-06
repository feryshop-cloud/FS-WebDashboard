import type { Metadata } from "next";
import "./globals.css";

const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath =
  routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";
const assetPath = (path: string) => `${basePath}${path}`;

export const metadata: Metadata = {
  title: "Ferryshop Dashboard",
  description: "Enterprise Ferryshop management platform",
  icons: {
    icon: [
      { url: assetPath("/favicon.ico"), sizes: "32x32", type: "image/x-icon" },
      { url: assetPath("/icon.png"), sizes: "32x32", type: "image/png" },
    ],
    shortcut: [assetPath("/favicon.ico")],
    apple: [{ url: assetPath("/apple-icon.png"), sizes: "180x180", type: "image/png" }],
  },
};

function getInitialTheme(): string {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("feryshop-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable
  }
  return "light";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = getInitialTheme();

  return (
    <html lang="en" className="h-full antialiased" data-theme={initialTheme === "dark" ? "dark" : undefined}>
      <body className="flex min-h-full flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
