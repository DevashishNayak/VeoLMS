"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiJson } from "@/components/admin/types";

/** Stable query-key factory for admin list/detail caching. */
export const adminKeys = {
  all: ["admin"] as const,
  courses: (params?: Record<string, string | number>) =>
    ["admin", "courses", params ?? {}] as const,
  course: (id: string) => ["admin", "courses", id] as const,
  users: (params?: Record<string, string | number>) =>
    ["admin", "users", params ?? {}] as const,
  sections: (params?: Record<string, string | number>) =>
    ["admin", "sections", params ?? {}] as const,
  lessons: (params?: Record<string, string | number>) =>
    ["admin", "lessons", params ?? {}] as const,
  enrollments: (params?: Record<string, string | number>) =>
    ["admin", "enrollments", params ?? {}] as const,
  payments: (params?: Record<string, string | number>) =>
    ["admin", "payments", params ?? {}] as const,
  progress: (params?: Record<string, string | number>) =>
    ["admin", "progress", params ?? {}] as const,
};

export async function fetchAdminJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await apiJson<T>(url, init);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

/** Invalidate one admin resource (all param variants) after mutations. */
export function useInvalidateAdmin() {
  const qc = useQueryClient();
  return useCallback(
    (...resources: string[]) => {
      for (const resource of resources) {
        void qc.invalidateQueries({ queryKey: ["admin", resource] });
      }
    },
    [qc]
  );
}
