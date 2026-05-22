import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { inferRoleFromUsername } from "./lib/roles";
import { routeAccessMap } from "./lib/settings";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  pattern: new RegExp(`^${route.replace("(.*)", ".*")}$`),
  allowedRoles: routeAccessMap[route],
}));

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role =
    (token?.role as string | undefined) ||
    inferRoleFromUsername(token?.username as string | undefined);

  const pathname = req.nextUrl.pathname;

  for (const { pattern, allowedRoles } of matchers) {
    if (!pattern.test(pathname)) continue;
    if (!role) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
