"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { FileUploadField } from "@/components/admin/file-upload-field";
import { apiJson, formatDuration } from "@/components/admin/types";

type LessonType = "VIDEO" | "TEXT" | "PDF";

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  youtubeId: string | null;
  videoUrl: string | null;
  content: string | null;
  pdfUrl: string | null;
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

const emptyForm = {
  sectionId: "",
  title: "",
  description: "",
  type: "VIDEO" as LessonType,
  youtubeId: "",
  videoUrl: "",
  content: "",
  pdfUrl: "",
  duration: 600,
  order: 0,
  isPreview: false,
};

const defaultMeta: PageMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminLessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AdminLessonsPageInner />
    </Suspense>
  );
}

function AdminLessonsPageInner() {
  const invalidate = useInvalidateAdmin();
  const [sections, setSections] = useState<SectionOpt[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<LessonRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
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
    filterKeys: ["courseId", "preview"],
  });
  const preview = getFilter("preview");
  const courseId = getFilter("courseId");

  const listParams = { page, pageSize, q, preview, courseId };
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: adminKeys.lessons(listParams),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (q) params.set("q", q);
      if (preview !== "all") params.set("preview", preview);
      if (courseId !== "all") params.set("courseId", courseId);
      return fetchAdminJson<{ lessons: LessonRow[]; meta: PageMeta }>(
        `/api/admin/lessons?${params}`,
        { signal },
      );
    },
  });

  const lessons = data?.lessons ?? [];
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

  async function loadSections() {
    const res = await apiJson<{ sections: SectionOpt[] }>(
      "/api/admin/sections?forSelect=1",
    );
    if (res.ok) {
      setSections(res.data.sections);
      return res.data.sections;
    }
    return sections;
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  async function openCreate() {
    setEditing(null);
    const list = await loadSections();
    setForm({
      ...emptyForm,
      sectionId: list[0]?.id ?? "",
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
      type: l.type,
      youtubeId: l.youtubeId ?? "",
      videoUrl: l.videoUrl ?? "",
      content: l.content ?? "",
      pdfUrl: l.pdfUrl ?? "",
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
      type: form.type,
      youtubeId: form.youtubeId,
      videoUrl: form.videoUrl,
      content: form.content,
      pdfUrl: form.pdfUrl,
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
    invalidate("lessons", "sections", "courses");
  }

  async function remove(l: LessonRow) {
    if (!confirm(`Delete lesson “${l.title}”?`)) return;
    const res = await apiJson(`/api/admin/lessons/${l.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return setError(res.error);
    setMessage("Lesson deleted");
    invalidate("lessons", "sections", "courses");
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
      <AdminAlert error={alertError} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          placeholder="Search lessons…"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <AdminClearFilters show={hasActiveFilters} onClear={clearFilters} />
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
              <TableHead>Lesson</TableHead>
              <TableHead>Course / Section</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Access</TableHead>
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
            ) : lessons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
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
                  <TableCell>
                    <Badge variant="secondary">{l.type}</Badge>
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as LessonType,
                })
              }
            >
              <option value="VIDEO">Video</option>
              <option value="TEXT">Text / Markdown</option>
              <option value="PDF">PDF</option>
            </Select>
          </div>
          {form.type === "VIDEO" && (
            <>
              <div>
                <Label>YouTube ID</Label>
                <Input
                  value={form.youtubeId}
                  onChange={(e) =>
                    setForm({ ...form, youtubeId: e.target.value })
                  }
                  placeholder="e.g. qz0aGYrrlhU"
                />
              </div>
              <FileUploadField
                label="Video file / URL"
                kind="video"
                value={form.videoUrl}
                onChange={(videoUrl) => setForm({ ...form, videoUrl })}
                hint="Optional if a YouTube ID is set"
              />
              <div>
                <Label>Notes (optional markdown)</Label>
                <Textarea
                  rows={3}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
            </>
          )}
          {form.type === "TEXT" && (
            <div>
              <Label>Content (markdown)</Label>
              <Textarea
                rows={8}
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                required
              />
            </div>
          )}
          {form.type === "PDF" && (
            <>
              <FileUploadField
                label="PDF file / URL"
                kind="pdf"
                value={form.pdfUrl}
                onChange={(pdfUrl) => setForm({ ...form, pdfUrl })}
              />
              <div>
                <Label>Notes (optional markdown)</Label>
                <Textarea
                  rows={3}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
            </>
          )}
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
              onChange={(e) =>
                setForm({ ...form, isPreview: e.target.checked })
              }
            />
            Free preview
          </label>
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
