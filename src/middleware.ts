import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath } from "@/server/auth/paths";
import { COOKIE_NAME, readSession } from "@/server/auth/session";

/**
 * Everything except the widget, the SMS webhooks, and the login page requires
 * a valid session cookie. Those three are the only things that have to work
 * without Ted being at his desk.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const session = await currentSession(request);
      if (session) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const session = await currentSession(request);
  if (session) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

async function currentSession(request: NextRequest) {
  return readSession(
    request.cookies.get(COOKIE_NAME)?.value,
    process.env.AUTH_SECRET ?? "",
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
