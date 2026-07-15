import { cookies } from "next/headers";
import { LearnPageSkeleton } from "@/components/learn/learn-stage-skeleton";
import {
  LEARN_SIDEBAR_COOKIE,
  parseSidebarOpen,
} from "@/lib/learn-sidebar-pref";

/** Matches collapsed/open course list from cookie so refresh doesn't flash the wrong layout. */
export default async function LearnLessonLoading() {
  const cookieStore = await cookies();
  const sidebarOpen = parseSidebarOpen(
    cookieStore.get(LEARN_SIDEBAR_COOKIE)?.value
  );
  return <LearnPageSkeleton sidebarOpen={sidebarOpen} />;
}
