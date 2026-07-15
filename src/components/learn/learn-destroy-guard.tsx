"use client";

import { useEffect } from "react";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";

/** Client-only install — avoids next/script in nested layouts (React warning). */
export function LearnDestroyGuard() {
  useEffect(() => {
    installVidstackDestroyGuard();
  }, []);
  return null;
}
