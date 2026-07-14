"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { AdminPagination } from "@/components/admin/pagination";
import {
  CountValue,
  DeleteAction,
  EditAction,
  EntityCell,
  RowActions,
  TextStack,
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
import { apiJson } from "@/components/admin/types";

type SectionRow = {
  id: string;
  title: string;
  order: number;
  courseId: string;
  course: { id: string; title: string; slug: string };
  _count: { lessons: number };
};

type CourseOpt = { id: string; title: string; slug: string };

const defaultMeta: PageMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminSectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AdminSectionsPageInner />
    </Suspense>
  );
}

function AdminSectionsPageInner() {
  const invalidate = useInvalidateAdmin();
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", order: 0 });
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
    filterKeys: ["courseId"],
  });
  const courseId = getFilter("courseId");

  const listParams = { page, pageSize, q, courseId };
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: adminKeys.sections(listParams),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (q) params.set("q", q);
      if (courseId !== "all") params.set("courseId", courseId);
      return fetchAdminJson<{ sections: SectionRow[]; meta: PageMeta }>(
        `/api/admin/sections?${params}`,
        { signal },
      );
    },
  });

  const sections = data?.sections ?? [];
  const meta = data?.meta ?? defaultMeta;
  const loading = isLoading;
  const alertError = error || (queryError ? queryError.message : "");

  async function loadCourses() {
    const res = await apiJson<{ courses: CourseOpt[] }>(
      "/api/admin/courses?forSelect=1",
    );
    if (res.ok) {
      setCourses(res.data.courses);
      return res.data.courses;
    }
    return courses;
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  async function openCreate() {
    setEditing(null);
    const list = courses.length ? courses : await loadCourses();
    setForm({ courseId: list[0]?.id ?? "", title: "", order: 0 });
    setModal("create");
  }

  function openEdit(s: SectionRow) {
    setEditing(s);
    setForm({ courseId: s.courseId, title: s.title, order: s.order });
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (modal === "create") {
      const res = await apiJson("/api/admin/sections", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Section created");
    } else if (editing) {
      const res = await apiJson(`/api/admin/sections/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: form.title, order: form.order }),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Section updated");
    }
    setModal(null);
    invalidate("sections", "courses", "lessons");
  }

  async function remove(s: SectionRow) {
    if (
      !confirm(
        `Delete section “${s.title}” and its ${s._count.lessons} lessons?`,
      )
    )
      return;
    const res = await apiJson(`/api/admin/sections/${s.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return setError(res.error);
    setMessage("Section deleted");
    invalidate("sections", "courses", "lessons");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Sections"
        description="All course sections. Create, edit, reorder, or delete."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New section
          </Button>
        }
      />
      <AdminAlert error={alertError} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          placeholder="Search sections…"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <AdminClearFilters show={hasActiveFilters} onClear={clearFilters} />
          <Select
            className="h-10 w-full sm:w-56"
            value={courseId}
            onChange={(e) => setFilter("courseId", e.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
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
              <TableHead>Section</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Lessons</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : sections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No sections match your filters
                </TableCell>
              </TableRow>
            ) : (
              sections.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <EntityCell
                      icon={Layers}
                      title={s.title}
                      subtitle={`Order ${s.order}`}
                    />
                  </TableCell>
                  <TableCell>
                    <TextStack
                      title={s.course.title}
                      href={`/admin/courses/${s.course.id}`}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {s.order}
                  </TableCell>
                  <TableCell>
                    <CountValue value={s._count.lessons} />
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <EditAction onClick={() => openEdit(s)} />
                      <DeleteAction onClick={() => remove(s)} />
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit section" : "Create section"}
      >
        <form onSubmit={save} className="space-y-3">
          {modal === "create" && (
            <div>
              <Label>Course</Label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                required
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Order</Label>
            <Input
              type="number"
              min={0}
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
