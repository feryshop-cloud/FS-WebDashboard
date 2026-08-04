import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { formatLog } from "@/lib/logging/format";

export async function proxy(request: NextRequest) {
  const incomingId = request.headers.get("x-request-id");
  const requestId = incomingId || crypto.randomUUID();

  const supabaseResponse = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        "x-request-id": requestId,
      }),
    },
  });
  supabaseResponse.headers.set("x-request-id", requestId);

  console.log(
    formatLog(
      "info",
      "request start",
      {
        method: request.method,
        path: request.nextUrl.pathname,
      },
      { service: "game-inventori", requestId },
    ),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!admin/api/health|api/health|admin/_next/static|_next/static|admin/_next/image|_next/image|admin/favicon.ico|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
