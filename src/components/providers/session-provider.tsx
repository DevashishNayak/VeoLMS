"use client";

import { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installVidstackDestroyGuard();
  }, []);

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
