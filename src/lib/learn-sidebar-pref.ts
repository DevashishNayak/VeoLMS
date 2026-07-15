/** Shared open/collapsed preference for the learn course-content panel. */

export const LEARN_SIDEBAR_KEY = "veolms:learn-sidebar";
export const LEARN_SIDEBAR_COOKIE = "veolms-learn-sidebar";

export function parseSidebarOpen(value: string | null | undefined): boolean {
  if (value === "0") return false;
  if (value === "1") return true;
  return true;
}

export function readSidebarOpenFromDocument(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${LEARN_SIDEBAR_COOKIE}=([01])`)
    );
    if (match) return match[1] === "1";
  } catch {
    /* ignore */
  }
  try {
    return parseSidebarOpen(localStorage.getItem(LEARN_SIDEBAR_KEY));
  } catch {
    return true;
  }
}

export function writeSidebarOpenPref(open: boolean) {
  const value = open ? "1" : "0";
  try {
    localStorage.setItem(LEARN_SIDEBAR_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${LEARN_SIDEBAR_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore */
  }
}
