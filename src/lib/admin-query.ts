import type { Prisma } from "@prisma/client";

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parseListQuery(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? 10) || 10)
  );
  const q = (url.searchParams.get("q") ?? "").trim();
  return { page, pageSize, q, skip: (page - 1) * pageSize };
}

export function pageMeta(
  total: number,
  page: number,
  pageSize: number
): PageMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function stringContains(
  fields: string[],
  q: string
): Prisma.StringFilter | undefined {
  if (!q) return undefined;
  return { contains: q, mode: "insensitive" };
}
