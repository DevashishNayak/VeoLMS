"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ListVideo, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AdminPagination } from "@/components/admin/pagination";
import {
  DeleteAction,
  EditAction,
  EmptyValue,
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
import { apiJson, formatDuration } from "@/components/admin/types";

type ProgressRow = {
  id: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
  user: { id: string; name: string; email: string };
  lesson: {
    id: string;
    title: string;
    section: {
      title: string;
      course: { id: string; title: string };
    };
  };
};

type UserOpt = { id: string; name: string; email: string };
type LessonOpt = {
  id: string;
  title: string;
  section: { title: string; course: { title: string } };
};

const defaultMeta: PageMeta = { page: 1, pageSize: 10, total: 0, totalPages: 1 };

export default function AdminProgressPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminProgressPageInner />
    </Suspense>
  );
}

function AdminProgressPageInner() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [lessons, setLessons] = useState<LessonOpt[]>([]);
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProgressRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    lessonId: "",
    watchedSeconds: 0,
    completed: false,
  });
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
    filterKeys: ["completed"],
  });
  const completed = getFilter("completed");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) params.set("q", q);
    if (completed !== "all") params.set("completed", completed);

    const res = await apiJson<{ progress: ProgressRow[]; meta: PageMeta }>(
      `/api/admin/progress?${params}`
    );
    if (res.ok) {
      setRows(res.data.progress);
      setMeta(res.data.meta);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [page, pageSize, q, completed]);

  async function loadSelectOptions() {
    const [uRes, lRes] = await Promise.all([
      apiJson<{ users: UserOpt[] }>("/api/admin/users?forSelect=1"),
      apiJson<{ lessons: LessonOpt[] }>("/api/admin/lessons?forSelect=1"),
    ]);
    if (uRes.ok) setUsers(uRes.data.users);
    if (lRes.ok) setLessons(lRes.data.lessons);
    return {
      users: uRes.ok ? uRes.data.users : users,
      lessons: lRes.ok ? lRes.data.lessons : lessons,
    };
  }

  useEffect(() => {
    load();
  }, [load]);

  async function openCreate() {
    setEditing(null);
    const opts = await loadSelectOptions();
    setForm({
      userId: opts.users[0]?.id ?? "",
      lessonId: opts.lessons[0]?.id ?? "",
      watchedSeconds: 0,
      completed: false,
    });
    setModal("create");
  }

  function openEdit(r: ProgressRow) {
    setEditing(r);
    setForm({
      userId: r.user.id,
      lessonId: r.lesson.id,
      watchedSeconds: r.watchedSeconds,
      completed: r.completed,
    });
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (modal === "create") {
      const res = await apiJson("/api/admin/progress", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Progress created");
    } else if (editing) {
      const res = await apiJson("/api/admin/progress", {
        method: "PUT",
        body: JSON.stringify({
          id: editing.id,
          watchedSeconds: Number(form.watchedSeconds),
          completed: form.completed,
        }),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Progress updated");
    }
    setModal(null);
    await load();
  }

  async function remove(r: ProgressRow) {
    if (!confirm(`Delete progress for ${r.user.name} / ${r.lesson.title}?`)) return;
    const res = await apiJson(`/api/admin/progress?id=${r.id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMessage("Progress deleted");
    await load();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Lesson progress"
        description="Track watched time and completion per student lesson."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add progress
          </Button>
        }
      />
      <AdminAlert error={error} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[200px] flex-1">
          <AdminSearch
            value={query}
            onChange={setQuery}
            placeholder="Search student, lesson, course…"
          />
        </div>
        <Select
          className="h-10 w-full sm:w-44"
          value={completed}
          onChange={(e) => setFilter("completed", e.target.value)}
        >
          <option value="all">All status</option>
          <option value="true">Completed</option>
          <option value="false">In progress</option>
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
              <TableHead>Lesson</TableHead>
              <TableHead>Watched</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last watched</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No progress rows match your filters
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
                      icon={ListVideo}
                      title={r.lesson.title}
                      subtitle={`${r.lesson.section.course.title} · ${r.lesson.section.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    {r.watchedSeconds > 0 ? (
                      <span className="text-sm tabular-nums">
                        {formatDuration(r.watchedSeconds)}
                      </span>
                    ) : (
                      <EmptyValue />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.completed ? "success" : "secondary"}>
                      {r.completed ? "Completed" : "In progress"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.lastWatchedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <EditAction onClick={() => openEdit(r)} />
                      <DeleteAction onClick={() => remove(r)} />
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
        title={modal === "edit" ? "Edit progress" : "Add progress"}
        className="max-w-xl"
      >
        <form onSubmit={save} className="space-y-3">
          {modal === "create" && (
            <>
              <div>
                <Label>User</Label>
                <Select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Lesson</Label>
                <Select
                  value={form.lessonId}
                  onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
                  required
                >
                  <option value="">Select lesson</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.section.course.title} — {l.title}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}
          <div>
            <Label>Watched seconds</Label>
            <Input
              type="number"
              min={0}
              value={form.watchedSeconds}
              onChange={(e) =>
                setForm({ ...form, watchedSeconds: Number(e.target.value) })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(e) => setForm({ ...form, completed: e.target.checked })}
            />
            Completed
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
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
