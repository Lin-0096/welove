import { NextRequest, NextResponse } from "next/server";

/**
 * Injects the current pathname as a custom header so the root layout
 * (which has no access to route segment params) can derive the active
 * locale and set <html lang> correctly on the server-rendered HTML.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
