"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { AdminPagination } from "@/components/admin/pagination";
import {
  DeleteAction,
  EntityCell,
  RowActions,
} from "@/components/admin/table-cells";
import {
  AdminAlert,
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
import { apiJson } from "@/components/admin/types";

type EnrollmentRow = {
  id: string;
  enrolledAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
};

type UserOpt = { id: string; name: string; email: string; role: string };
type CourseOpt = { id: string; title: string; slug: string };

const defaultMeta: PageMeta = { page: 1, pageSize: 10, total: 0, totalPages: 1 };

export default function AdminEnrollmentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminEnrollmentsPageInner />
    </Suspense>
  );
}

function AdminEnrollmentsPageInner() {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", courseId: "" });
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
  } = useAdminListQuery({
    filterKeys: ["courseId"],
  });
  const courseId = getFilter("courseId");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) params.set("q", q);
    if (courseId !== "all") params.set("courseId", courseId);

    const res = await apiJson<{ enrollments: EnrollmentRow[]; meta: PageMeta }>(
      `/api/admin/enrollments?${params}`
    );
    if (res.ok) {
      setRows(res.data.enrollments);
      setMeta(res.data.meta);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [page, pageSize, q, courseId]);

  async function loadCourses() {
    const res = await apiJson<{ courses: CourseOpt[] }>(
      "/api/admin/courses?forSelect=1"
    );
    if (res.ok) {
      setCourses(res.data.courses);
      return res.data.courses;
    }
    return courses;
  }

  async function loadStudents() {
    const res = await apiJson<{ users: UserOpt[] }>(
      "/api/admin/users?forSelect=1&role=STUDENT"
    );
    if (res.ok) {
      setUsers(res.data.users);
      return res.data.users;
    }
    return users;
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void loadCourses();
  }, []);

  async function openCreate() {
    setForm({ userId: "", courseId: "" });
    await Promise.all([
      loadStudents(),
      courses.length === 0 ? loadCourses() : Promise.resolve(),
    ]);
    setOpen(true);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiJson("/api/admin/enrollments", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setMessage("Enrollment created");
    setOpen(false);
    setForm({ userId: "", courseId: "" });
    await load();
  }

  async function remove(r: EnrollmentRow) {
    if (!confirm(`Unenroll ${r.user.name} from ${r.course.title}?`)) return;
    const res = await apiJson(`/api/admin/enrollments?id=${r.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return setError(res.error);
    setMessage("Enrollment removed");
    await load();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Enrollments"
        description="Grant or revoke course access for students."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Enroll student
          </Button>
        }
      />
      <AdminAlert error={error} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[200px] flex-1">
          <AdminSearch value={query} onChange={setQuery} placeholder="Search enrollments…" />
        </div>
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

      <AdminTableShell
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
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No enrollments match your filters
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <EntityCell
                      initials={r.user.name}
                      title={r.user.name}
                      subtitle={r.user.email}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityCell
                      icon={BookOpen}
                      title={r.course.title}
                      href={`/admin/courses/${r.course.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.enrolledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <DeleteAction
                        label="Remove enrollment"
                        onClick={() => remove(r)}
                      />
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Modal open={open} onClose={() => setOpen(false)} title="Create enrollment">
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label>Student</Label>
            <Select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            >
              <option value="">Select student</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </div>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Enroll"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
