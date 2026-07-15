"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { AdminPagination } from "@/components/admin/pagination";
import {
  CountValue,
  DeleteAction,
  EditAction,
  EntityCell,
  IconAction,
  RowActions,
} from "@/components/admin/table-cells";
import {
  AdminAlert,
  AdminClearFilters,
  AdminPageHeader,
  AdminSearch,
  AdminTableShell,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/page-kit";
import { useAdminListQuery } from "@/hooks/use-admin-list-query";
import type { PageMeta } from "@/lib/admin-query";
import {
  adminKeys,
  fetchAdminJson,
  useInvalidateAdmin,
} from "@/lib/admin-cache";
import {
  apiJson,
  formatPrice,
  type AdminCourse,
} from "@/components/admin/types";

const empty = {
  title: "",
  subtitle: "",
  description: "",
  thumbnail: "",
  priceInPaise: 49900,
  featured: false,
  published: true,
  deliveryType: "SELF_PACED" as "SELF_PACED" | "LIVE" | "OFFLINE",
  learningOutcomes: [
    "Build real projects with clear guidance",
    "Learn core concepts through video lessons",
    "Practice with notes and downloadable resources",
    "Track progress through every lecture",
  ],
  requirements: [
    "A computer with internet access and a modern browser",
  ],
};

const defaultMeta: PageMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AdminCoursesPageInner />
    </Suspense>
  );
}

function AdminCoursesPageInner() {
  const invalidate = useInvalidateAdmin();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const {
    page,
    pageSize,
    query,
    setQuery,
    q,
    getFilter,
    setPage,
    setPageSize,
    setFilter,
    hasActiveFilters,
    clearFilters,
    clearSearch,
  } = useAdminListQuery({
    filterKeys: ["published", "featured"],
  });
  const published = getFilter("published");
  const featured = getFilter("featured");

  const listParams = { page, pageSize, q, published, featured };
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: adminKeys.courses(listParams),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (q) params.set("q", q);
      if (published !== "all") params.set("published", published);
      if (featured !== "all") params.set("featured", featured);
      return fetchAdminJson<{ courses: AdminCourse[]; meta: PageMeta }>(
        `/api/admin/courses?${params}`,
        { signal },
      );
    },
  });

  const courses = data?.courses ?? [];
  const meta = data?.meta ?? defaultMeta;
  const loading = isLoading;
  const alertError = error || (queryError ? queryError.message : "");

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (!form.thumbnail) {
      setSaving(false);
      setError("Please upload a thumbnail image (or paste a URL)");
      return;
    }
    const res = await apiJson<{ course: AdminCourse }>("/api/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        priceInPaise: Number(form.priceInPaise),
      }),
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setMessage("Course created — open it to add sections and lessons");
    setOpen(false);
    setForm(empty);
    invalidate("courses");
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete “${title}” and all its sections/lessons?`)) return;
    const res = await apiJson(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMessage("Course deleted");
    invalidate("courses", "sections", "lessons");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Courses"
        description="Create and manage courses. Open a course for the curriculum editor."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        }
      />
      <AdminAlert error={alertError} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          placeholder="Search title, slug, description…"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <AdminClearFilters show={hasActiveFilters} onClear={clearFilters} />
          <Select
            className="h-10 w-full sm:w-40"
            value={published}
            onChange={(e) => setFilter("published", e.target.value)}
          >
            <option value="all">All status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
          <Select
            className="h-10 w-full sm:w-40"
            value={featured}
            onChange={(e) => setFilter("featured", e.target.value)}
          >
            <option value="all">All featured</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </Select>
        </div>
      </div>

      <AdminTableShell
        refreshing={isFetching && !isLoading}
        footer={
          <AdminPagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[240px]">Course</TableHead>
              <TableHead>Curriculum</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No courses match your filters
                </TableCell>
              </TableRow>
            ) : (
              courses.map((c) => {
                const lessons = c.sections.reduce(
                  (n, s) => n + s.lessons.length,
                  0,
                );
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <EntityCell
                        image={c.thumbnail || ""}
                        imageAlt={c.title}
                        title={c.title}
                        subtitle={c.description || "No description"}
                        href={`/admin/courses/${c.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-sm">
                        <p>
                          <span className="font-medium tabular-nums">
                            {c.sections.length}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            section{c.sections.length === 1 ? "" : "s"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium tabular-nums">
                            {lessons}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            lesson{lessons === 1 ? "" : "s"}
                          </span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {c.priceInPaise === 0 ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        formatPrice(c.priceInPaise)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={c.published ? "success" : "secondary"}>
                          {c.published ? "Published" : "Draft"}
                        </Badge>
                        {c.featured && (
                          <Badge variant="featured">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CountValue value={c._count.enrollments} />
                    </TableCell>
                    <TableCell>
                      <RowActions>
                        <EditAction
                          href={`/admin/courses/${c.id}`}
                          label="Edit"
                        />
                        <IconAction
                          label="View public page"
                          href={`/courses/${c.slug}`}
                          external
                          icon={ExternalLink}
                        />
                        <DeleteAction
                          label="Delete course"
                          onClick={() => remove(c.id, c.title)}
                        />
                      </RowActions>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create course"
        className="max-w-xl"
      >
        <form onSubmit={createCourse} className="space-y-4">
          <div>
            <Label>Title (5–80 chars)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              minLength={5}
              maxLength={80}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Aim for ≤60 chars so the course hero stays one line
            </p>
          </div>
          <div>
            <Label>Subtitle (20–160 chars)</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              required
              minLength={20}
              maxLength={160}
              placeholder="Short pitch for cards and the course hero"
            />
          </div>
          <div>
            <Label>Full description (80+ chars)</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
              minLength={80}
              rows={5}
              placeholder="Long description shown in the Description section"
            />
          </div>
          <ImageUploadField
            value={form.thumbnail}
            onChange={(thumbnail) => setForm({ ...form, thumbnail })}
          />
          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.priceInPaise / 100}
              onChange={(e) =>
                setForm({
                  ...form,
                  priceInPaise: Math.round(Number(e.target.value) * 100),
                })
              }
            />
          </div>
          <div>
            <Label>Delivery type</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.deliveryType}
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryType: e.target.value as typeof form.deliveryType,
                })
              }
            >
              <option value="SELF_PACED">On-demand (online)</option>
              <option value="LIVE">Live sessions</option>
              <option value="OFFLINE">In-person / offline</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60">
              <input
                type="checkbox"
                className="size-4 cursor-pointer accent-primary"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />
              Featured
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60">
              <input
                type="checkbox"
                className="size-4 cursor-pointer accent-primary"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create course"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
