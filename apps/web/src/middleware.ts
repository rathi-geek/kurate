import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/config";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest): NextResponse {
  // next-intl: detects locale from Accept-Language header / cookie,
  // sets it in request headers so getLocale() and getMessages() work.
  return intlMiddleware(request) as NextResponse;
}

export const config = {
  // Run on all routes except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
