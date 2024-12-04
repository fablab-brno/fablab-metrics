import { hashPassword } from "fablab-metrics/auth/hasher";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  const password = process.env.AUTH_PASSWORD!;

  if (!isPublicRoute && password) {
    const hash = (await cookies()).get(process.env.COOKIE_AUTH!)?.value;
    const expected = await hashPassword(password);

    if (hash !== expected) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
