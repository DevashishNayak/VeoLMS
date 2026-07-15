import { cn } from "@/lib/utils";

/** Clean media block — no fake play button / control chrome. */
export function LearnStageSkeleton() {
  return (
    <div
      className="aspect-video w-full max-h-[calc(100dvh-10rem)] animate-pulse rounded-xl bg-muted"
      aria-hidden
    />
  );
}

function LearnMainColumnSkeleton() {
  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-6">
      <LearnStageSkeleton />
      <div className="h-7 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-2 flex gap-3 border-b border-border pb-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}

function LearnSidebarSkeleton() {
  return (
    <div className="relative hidden min-h-0 lg:block">
      <div className="h-[calc(100dvh-4rem-2.75rem-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-[calc(4rem+2.75rem+1rem)]">
        <div className="space-y-3 px-4 py-2.5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-1.5 animate-pulse rounded-full bg-muted" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-9 items-center gap-2">
              <div className="h-4 w-4 shrink-0 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Full-page learn skeleton.
 * `sidebarOpen` should come from the learn-sidebar cookie (server-read).
 */
export function LearnPageSkeleton({
  sidebarOpen = true,
}: {
  sidebarOpen?: boolean;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-background">
      <div className="sticky top-16 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-11 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-md border border-border bg-muted/50" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto grid w-full max-w-[1400px] flex-1 items-start gap-4 px-4 py-4 sm:px-6",
          sidebarOpen
            ? "lg:grid-cols-[minmax(0,1fr)_360px]"
            : "lg:grid-cols-1"
        )}
      >
        <LearnMainColumnSkeleton />
        {sidebarOpen ? <LearnSidebarSkeleton /> : null}
      </div>
    </div>
  );
}
