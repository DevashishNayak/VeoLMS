"use client";

import { useEffect } from "react";
import {
  SessionProvider as NextAuthSessionProvider,
} from "next-auth/react";
import type { Session } from "next-auth";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";

/**
 * Auth.js logs ClientFetchError (and Next’s overlay surfaces it) when
 * `/api/auth/session` can’t be reached — common during `next dev` restarts
 * (Prisma regenerate) or a brief compile pause.
 *
 * Mitigations: hydrate session from the server layout, skip focus refetch in
 * development, and don’t poll.
 */
export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  useEffect(() => {
    installVidstackDestroyGuard();
  }, []);

  return (
    <NextAuthSessionProvider
      session={session}
      basePath="/api/auth"
      refetchInterval={0}
      refetchWhenOffline={false}
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
