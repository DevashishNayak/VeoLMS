"use client";

import { useEffect } from "react";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";
import {
  LEARN_SIDEBAR_COOKIE,
  LEARN_SIDEBAR_KEY,
  writeSidebarOpenPref,
  parseSidebarOpen,
} from "@/lib/learn-sidebar-pref";

/** Client-only boot — avoid raw <script> in layouts (React warning). */
export function LearnDestroyGuard() {
  useEffect(() => {
    installVidstackDestroyGuard();
    try {
      const hasCookie = document.cookie.includes(`${LEARN_SIDEBAR_COOKIE}=`);
      if (!hasCookie) {
        const fromLs = localStorage.getItem(LEARN_SIDEBAR_KEY);
        if (fromLs === "0" || fromLs === "1") {
          writeSidebarOpenPref(parseSidebarOpen(fromLs));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
