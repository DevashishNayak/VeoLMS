import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (no Prisma / bcrypt).
 * Used by middleware so the Edge Function stays under Vercel size limits.
 */
export const authConfig = {
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

      if (
        (pathname.startsWith("/dashboard") || pathname.startsWith("/learn")) &&
        !isLoggedIn
      ) {
        return false;
      }

      if (pathname.startsWith("/admin") && (!isLoggedIn || role !== "ADMIN")) {
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
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
