import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that allows Auth.js to handle sessions
// We don't need to check auth here since the app allows anonymous access
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Optionally configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
