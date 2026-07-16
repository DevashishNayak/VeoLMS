import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (no Prisma / bcrypt).
 * Used by middleware so the Edge Function stays under Vercel size limits.
 */
export const authConfig = {
  // Behind Vercel / local proxies; same as AUTH_TRUST_HOST=true.
  trustHost: true,
  // Only pass a real secret — empty-string env placeholders trigger MissingSecret.
  ...(process.env.AUTH_SECRET?.trim()
    ? { secret: process.env.AUTH_SECRET.trim() }
    : {}),
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname.startsWith("/dashboard") && !isLoggedIn) {
        return false;
      }

      // Preview lessons are checked in the learn page / content API.
      if (pathname.startsWith("/learn")) {
        return true;
      }

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (role === "ADMIN" || role === "INSTRUCTOR") return true;
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "STUDENT"
          | "INSTRUCTOR"
          | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
