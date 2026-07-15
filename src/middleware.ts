import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Dashboard + profile require login. /learn is gated in the page/API
  // so Preview lectures can work without an account.
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) &&
    !isLoggedIn
  ) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const staff = role === "ADMIN" || role === "INSTRUCTOR";
    if (!isLoggedIn || !staff) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    // Instructors only get course-curriculum routes (not user/billing admin).
    if (role === "INSTRUCTOR") {
      const allowed =
        pathname === "/admin" ||
        pathname.startsWith("/admin/courses") ||
        pathname.startsWith("/admin/sections") ||
        pathname.startsWith("/admin/lessons");
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/courses", req.nextUrl.origin));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/learn/:path*",
    "/admin/:path*",
  ],
};
