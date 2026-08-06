import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
