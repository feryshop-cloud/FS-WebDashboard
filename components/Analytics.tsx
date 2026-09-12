"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function pageview(url: string) {
  if (!gaId) return;
  window.gtag("config", gaId, { page_path: url });
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    pageview(url);
  }, [pathname, searchParams]);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
