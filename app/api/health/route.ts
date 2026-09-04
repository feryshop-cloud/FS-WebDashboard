import { NextResponse } from "next/server";
import { httpRequestDuration, httpRequestsTotal } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export function GET() {
  httpRequestDuration.observe({ method: "GET", route: "/api/health", status: "200" }, 0.001);
  httpRequestsTotal.inc({ method: "GET", route: "/api/health", status: "200" });
  return NextResponse.json({ ok: true });
}
