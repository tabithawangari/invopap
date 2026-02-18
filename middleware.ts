// middleware.ts — CSRF protection + Supabase session refresh
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths exempt from CSRF checking
const CSRF_EXEMPT_PATHS = ["/api/payments/callback"];

// Mutating methods that require CSRF protection
const MUTATING_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

// Editor page routes — skip session refresh for these (client-side useAuth handles it)
const EDITOR_ROUTES = [
  "/cash-sale",
  "/delivery-note",
  "/quotation",
  "/purchase-order",
  "/receipt",
];

function isEditorRoute(pathname: string): boolean {
  // Exact match for home "/"
  if (pathname === "/") return true;
  // Exact match for editor routes (not their sub-routes like /api/cash-sales)
  return EDITOR_ROUTES.some((route) => pathname === route);
}

export async function middleware(request: NextRequest) {
  // 1. CSRF protection for mutating requests
  if (MUTATING_METHODS.includes(request.method)) {
    const pathname = request.nextUrl.pathname;
    const isExempt = CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

    if (!isExempt && process.env.NODE_ENV === "production") {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;

      if (origin) {
        const originHost = new URL(origin).host;
        const expectedHost = appUrl ? new URL(appUrl).host : host;

        if (originHost !== expectedHost) {
          return NextResponse.json(
            { error: "CSRF: Origin mismatch" },
            { status: 403 }
          );
        }
      }
    }
  }

  // 2. Skip Supabase session refresh for editor pages (saves 50-200ms per navigation)
  if (isEditorRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // 3. Refresh Supabase session for all other routes (API, dashboard, auth, etc.)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
