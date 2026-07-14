"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ListVideo, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  TextStack,
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

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  youtubeId: string;
  duration: number;
  order: number;
  isPreview: boolean;
  sectionId: string;
  section: {
    id: string;
    title: string;
    course: { id: string; title: string };
  };
};

type SectionOpt = {
  id: string;
  title: string;
  course: { id: string; title: string };
};

type CourseOpt = { id: string; title: string; slug: string };

const defaultMeta: PageMeta = { page: 1, pageSize: 10, total: 0, totalPages: 1 };

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminLessonsPageInner />
    </Suspense>
  );
}

function AdminLessonsPageInner() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [sections, setSections] = useState<SectionOpt[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<LessonRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sectionId: "",
    title: "",
    description: "",
    youtubeId: "",
    duration: 600,
    order: 0,
    isPreview: false,
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
    filterKeys: ["courseId", "preview"],
  });
  const preview = getFilter("preview");
  const courseId = getFilter("courseId");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) params.set("q", q);
    if (preview !== "all") params.set("preview", preview);
    if (courseId !== "all") params.set("courseId", courseId);

    const res = await apiJson<{ lessons: LessonRow[]; meta: PageMeta }>(
      `/api/admin/lessons?${params}`
    );
    if (res.ok) {
      setLessons(res.data.lessons);
      setMeta(res.data.meta);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [page, pageSize, q, preview, courseId]);

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

  async function loadSections() {
    const res = await apiJson<{ sections: SectionOpt[] }>(
      "/api/admin/sections?forSelect=1"
    );
    if (res.ok) {
      setSections(res.data.sections);
      return res.data.sections;
    }
    return sections;
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void loadCourses();
  }, []);

  async function openCreate() {
    setEditing(null);
    const list = await loadSections();
    setForm({
      sectionId: list[0]?.id ?? "",
      title: "",
      description: "",
      youtubeId: "",
      duration: 600,
      order: 0,
      isPreview: false,
    });
    setModal("create");
  }

  async function openEdit(l: LessonRow) {
    setEditing(l);
    if (sections.length === 0) await loadSections();
    setForm({
      sectionId: l.sectionId,
      title: l.title,
      description: l.description ?? "",
      youtubeId: l.youtubeId,
      duration: l.duration,
      order: l.order,
      isPreview: l.isPreview,
    });
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      description: form.description || null,
      youtubeId: form.youtubeId,
      duration: Number(form.duration),
      order: Number(form.order),
      isPreview: form.isPreview,
      sectionId: form.sectionId,
    };
    if (modal === "create") {
      const res = await apiJson("/api/admin/lessons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Lesson created");
    } else if (editing) {
      const res = await apiJson(`/api/admin/lessons/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("Lesson updated");
    }
    setModal(null);
    await load();
  }

  async function remove(l: LessonRow) {
    if (!confirm(`Delete lesson “${l.title}”?`)) return;
    const res = await apiJson(`/api/admin/lessons/${l.id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMessage("Lesson deleted");
    await load();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Lessons"
        description="All lessons across every course section."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New lesson
          </Button>
        }
      />
      <AdminAlert error={error} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[200px] flex-1">
          <AdminSearch
            value={query}
            onChange={setQuery}
            placeholder="Search lessons…"
          />
        </div>
        <Select
          className="h-10 w-full sm:w-40"
          value={preview}
          onChange={(e) => setFilter("preview", e.target.value)}
        >
          <option value="all">All access</option>
          <option value="true">Preview</option>
          <option value="false">Enrolled only</option>
        </Select>
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
              <TableHead>Lesson</TableHead>
              <TableHead>Course / Section</TableHead>
              <TableHead>YouTube</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Access</TableHead>
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
            ) : lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No lessons match your filters
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <EntityCell
                      icon={ListVideo}
                      title={l.title}
                      subtitle={`Order ${l.order}`}
                    />
                  </TableCell>
                  <TableCell>
                    <TextStack
                      title={l.section.course.title}
                      subtitle={l.section.title}
                      href={`/admin/courses/${l.section.course.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {l.youtubeId || <EmptyValue />}
                  </TableCell>
                  <TableCell>
                    {l.duration > 0 ? (
                      <span className="text-sm tabular-nums">
                        {formatDuration(l.duration)}
                      </span>
                    ) : (
                      <EmptyValue />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.isPreview ? "warning" : "secondary"}>
                      {l.isPreview ? "Preview" : "Enrolled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <EditAction onClick={() => openEdit(l)} />
                      <DeleteAction onClick={() => remove(l)} />
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
        title={modal === "edit" ? "Edit lesson" : "Create lesson"}
        className="max-w-xl"
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Section</Label>
            <Select
              value={form.sectionId}
              onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
              required
            >
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course.title} — {s.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>YouTube ID</Label>
            <Input
              value={form.youtubeId}
              onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (sec)</Label>
              <Input
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
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
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPreview}
              onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
            />
            Free preview
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
