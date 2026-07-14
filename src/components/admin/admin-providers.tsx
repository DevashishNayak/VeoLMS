"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";
import { AdminShell } from "@/components/admin/admin-shell";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 1000 * 60 * 60 * 6,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeQueryClient);
  const [persister, setPersister] = useState<Persister | null>(null);

  useEffect(() => {
    setPersister(
      createSyncStoragePersister({
        storage: window.sessionStorage,
        key: "veolms-admin-query-cache",
      })
    );
  }, []);

  const shell = <AdminShell>{children}</AdminShell>;

  if (!persister) {
    return <QueryClientProvider client={client}>{shell}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 6,
        buster: "v1",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "admin",
        },
      }}
    >
      {shell}
    </PersistQueryClientProvider>
  );
}
