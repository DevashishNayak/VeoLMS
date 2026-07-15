"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { FileUploadField } from "@/components/admin/file-upload-field";
import {
  VideoSourceFields,
  type VideoProviderValue,
} from "@/components/admin/video-source-fields";
import { cn } from "@/lib/utils";
import {
  apiJson,
  formatDuration,
  formatPrice,
  type AdminCourse,
  type AdminLesson,
  type AdminSection,
} from "@/components/admin/types";
import { COURSE_LIMITS } from "@/lib/course-limits";
import { useInvalidateAdmin } from "@/lib/admin-cache";

type LessonForm = {
  title: string;
  description: string;
  type: "VIDEO" | "TEXT" | "PDF";
  videoProvider: VideoProviderValue;
  videoSrc: string;
  content: string;
  pdfUrl: string;
  duration: number;
  isPreview: boolean;
  order?: number;
  resourceTitle: string;
  resourceUrl: string;
};

const emptyLesson: LessonForm = {
  title: "",
  description: "",
  type: "VIDEO",
  videoProvider: "YOUTUBE",
  videoSrc: "",
  content: "",
  pdfUrl: "",
  duration: 600,
  isPreview: false,
  resourceTitle: "",
  resourceUrl: "",
};

export default function AdminCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const invalidate = useInvalidateAdmin();

  const [tab, setTab] = useState<"details" | "curriculum">("curriculum");
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [meta, setMeta] = useState({
    title: "",
    subtitle: "",
    description: "",
    thumbnail: "",
    priceInPaise: 0,
    featured: false,
    published: true,
    deliveryType: "SELF_PACED" as "SELF_PACED" | "LIVE" | "OFFLINE",
    instructorId: "",
    categoryId: "",
    trailerProvider: "" as VideoProviderValue,
    trailerSrc: "",
    learningOutcomesText: "",
    requirementsText: "",
  });
  const [staffUsers, setStaffUsers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; parentName?: string | null }[]
  >([]);

  const [sectionModal, setSectionModal] = useState<{
    mode: "create" | "edit";
    section?: AdminSection;
  } | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionOrder, setSectionOrder] = useState(0);
  const [sectionSaving, setSectionSaving] = useState(false);

  const [lessonModal, setLessonModal] = useState<{
    mode: "create" | "edit";
    sectionId: string;
    lesson?: AdminLesson;
  } | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);
  const [lessonSaving, setLessonSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiJson<{ course: AdminCourse }>(
      `/api/admin/courses/${courseId}`
    );
    if (!res.ok) {
      setError(res.error);
      setCourse(null);
      setLoading(false);
      return;
    }
    const c = res.data.course;
    setCourse(c);
    setMeta({
      title: c.title,
      subtitle: c.subtitle ?? "",
      description: c.description,
      thumbnail: c.thumbnail,
      priceInPaise: c.priceInPaise,
      featured: c.featured,
      published: c.published,
      deliveryType: c.deliveryType ?? "SELF_PACED",
      instructorId: c.instructorId ?? c.instructor?.id ?? "",
      categoryId: c.categoryId ?? "",
      trailerProvider: (c.trailerProvider ?? "") as VideoProviderValue,
      trailerSrc: c.trailerSrc ?? "",
      learningOutcomesText: (c.learningOutcomes ?? []).join("\n"),
      requirementsText: (c.requirements ?? []).join("\n"),
    });
    setExpanded((prev) => {
      const next = { ...prev };
      for (const s of c.sections) {
        if (next[s.id] === undefined) next[s.id] = true;
      }
      return next;
    });
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Admin-only instructor picker (403 for instructors is fine).
    void apiJson<{
      users: { id: string; name: string; email: string; role: string }[];
    }>("/api/admin/users?forSelect=1&staff=1").then((res) => {
      if (res.ok) setStaffUsers(res.data.users);
    });
    void apiJson<{
      categories: { id: string; name: string; parentName?: string | null }[];
    }>("/api/admin/categories?forSelect=1").then((res) => {
      if (res.ok) setCategories(res.data.categories);
    });
  }, []);

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!meta.thumbnail) {
      setError("Please upload a thumbnail image (or paste a URL)");
      return;
    }
    setSavingMeta(true);
    setError("");
    setMessage("");
    const res = await apiJson(`/api/admin/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: meta.title,
        subtitle: meta.subtitle,
        description: meta.description,
        thumbnail: meta.thumbnail,
        priceInPaise: Number(meta.priceInPaise),
        featured: meta.featured,
        published: meta.published,
        deliveryType: meta.deliveryType,
        categoryId: meta.categoryId || null,
        trailerProvider: meta.trailerProvider || null,
        trailerSrc: meta.trailerSrc || null,
        ...(staffUsers.length && meta.instructorId
          ? { instructorId: meta.instructorId }
          : {}),
        learningOutcomes: meta.learningOutcomesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: meta.requirementsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setSavingMeta(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Course details saved");
    await load();
    invalidate("courses");
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionModal) return;
    setSectionSaving(true);
    setError("");
    setMessage("");

    if (sectionModal.mode === "create") {
      const res = await apiJson("/api/admin/sections", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          title: sectionTitle,
          order: sectionOrder,
        }),
      });
      setSectionSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage("Section added");
    } else if (sectionModal.section) {
      const res = await apiJson(`/api/admin/sections/${sectionModal.section.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: sectionTitle, order: sectionOrder }),
      });
      setSectionSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage("Section updated");
    }

    setSectionModal(null);
    await load();
    invalidate("courses", "sections", "lessons");
  }

  async function deleteSection(section: AdminSection) {
    if (
      !confirm(
        `Delete section “${section.title}” and its ${section.lessons.length} lesson(s)?`
      )
    ) {
      return;
    }
    setError("");
    const res = await apiJson(`/api/admin/sections/${section.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Section deleted");
    await load();
    invalidate("courses", "sections", "lessons");
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonModal) return;
    setLessonSaving(true);
    setError("");
    setMessage("");

    const resources =
      lessonForm.resourceTitle.trim() && lessonForm.resourceUrl.trim()
        ? [
            {
              title: lessonForm.resourceTitle.trim(),
              url: lessonForm.resourceUrl.trim(),
            },
          ]
        : lessonModal.mode === "edit"
          ? []
          : undefined;

    const payload = {
      title: lessonForm.title,
      description: lessonForm.description || null,
      type: lessonForm.type,
      videoProvider: lessonForm.videoProvider || null,
      videoSrc: lessonForm.videoSrc,
      content: lessonForm.content,
      pdfUrl: lessonForm.pdfUrl,
      duration: Number(lessonForm.duration),
      isPreview: lessonForm.isPreview,
      order: lessonForm.order,
      ...(resources !== undefined ? { resources } : {}),
    };

    if (lessonModal.mode === "create") {
      const res = await apiJson("/api/admin/lessons", {
        method: "POST",
        body: JSON.stringify({
          sectionId: lessonModal.sectionId,
          ...payload,
        }),
      });
      setLessonSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage("Lesson added");
    } else if (lessonModal.lesson) {
      const res = await apiJson(`/api/admin/lessons/${lessonModal.lesson.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setLessonSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage("Lesson updated");
    }

    setLessonModal(null);
    setLessonForm(emptyLesson);
    await load();
    invalidate("courses", "sections", "lessons");
  }

  async function deleteLesson(lesson: AdminLesson) {
    if (!confirm(`Delete lesson “${lesson.title}”?`)) return;
    setError("");
    const res = await apiJson(`/api/admin/lessons/${lesson.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Lesson deleted");
    await load();
    invalidate("courses", "sections", "lessons");
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Loading course…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-muted-foreground">{error || "Course not found"}</p>
        <Button asChild variant="outline">
          <Link href="/admin/courses">Back to courses</Link>
        </Button>
      </div>
    );
  }

  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-2rem)] flex-col gap-3 overflow-hidden lg:h-[calc(100dvh-3.5rem-3rem)]">
      {/* Compact header — no tall block */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin/courses"
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Courses
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="truncate text-lg font-semibold text-foreground">
          {course.title}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={course.published ? "success" : "secondary"}>
            {course.published ? "Published" : "Draft"}
          </Badge>
          {course.featured && <Badge variant="featured">Featured</Badge>}
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {course.sections.length} sections · {lessonCount} lessons ·{" "}
          {course._count.enrollments || "—"} enrolled ·{" "}
          {formatPrice(course.priceInPaise)}
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/courses/${course.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View page
          </a>
        </Button>
      </div>

      {(error || message) && (
        <div
          className={cn(
            "shrink-0 rounded-lg border px-3 py-2 text-sm",
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
          )}
        >
          {error || message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex shrink-0 gap-1 border-b border-border">
        {(
          [
            ["curriculum", "Curriculum"],
            ["details", "Course details"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels — only this area scrolls if needed */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "details" && (
          <form
            onSubmit={saveMeta}
            className="grid h-full min-h-0 gap-4 overflow-y-auto rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(200px,280px)_1fr] lg:overflow-hidden"
          >
            <div className="min-w-0 lg:overflow-y-auto">
              <ImageUploadField
                value={meta.thumbnail}
                onChange={(thumbnail) => setMeta({ ...meta, thumbnail })}
                label="Thumbnail"
              />
            </div>
            <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>
                    Title ({COURSE_LIMITS.title.min}–{COURSE_LIMITS.title.max}{" "}
                    chars)
                  </Label>
                  <Input
                    value={meta.title}
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    maxLength={COURSE_LIMITS.title.max}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {meta.title.length}/{COURSE_LIMITS.title.max} — aim for ≤
                    {COURSE_LIMITS.title.recommended} so the hero stays one line
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label>Subtitle / card pitch (20–160 chars)</Label>
                  <Input
                    value={meta.subtitle}
                    onChange={(e) =>
                      setMeta({ ...meta, subtitle: e.target.value })
                    }
                    maxLength={160}
                    placeholder="Short line shown on cards and under the hero title"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {meta.subtitle.length}/160 — keep short; UI truncates with line-clamp (don’t type …)
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label>Full description (80+ chars)</Label>
                  <Textarea
                    rows={8}
                    value={meta.description}
                    onChange={(e) =>
                      setMeta({ ...meta, description: e.target.value })
                    }
                    placeholder="Long-form description for the Description section (not the same as subtitle)"
                    required
                  />
                </div>
                {categories.length > 0 && (
                  <div className="sm:col-span-2">
                    <Label>Category</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      value={meta.categoryId}
                      onChange={(e) =>
                        setMeta({ ...meta, categoryId: e.target.value })
                      }
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.parentName
                            ? `${cat.parentName} › ${cat.name}`
                            : cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Label>
                    What you’ll learn ({COURSE_LIMITS.outcomes.min}–
                    {COURSE_LIMITS.outcomes.max} lines, ≤
                    {COURSE_LIMITS.outcome.max} chars each)
                  </Label>
                  <Textarea
                    rows={5}
                    value={meta.learningOutcomesText}
                    onChange={(e) =>
                      setMeta({ ...meta, learningOutcomesText: e.target.value })
                    }
                    placeholder={
                      "Build responsive layouts with Flexbox\nMaster modern CSS Grid patterns\nShip a small project end to end\nTrack progress lecture by lecture"
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    One outcome per line. Aim for ≤
                    {COURSE_LIMITS.outcome.recommended} chars so each stays one
                    line in the 2-column list.
                    {meta.learningOutcomesText
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .some((l) => l.length > COURSE_LIMITS.outcome.recommended)
                      ? " Some lines are longer — consider shortening."
                      : null}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label>Requirements (1–8 lines, 8–150 chars each)</Label>
                  <Textarea
                    rows={3}
                    value={meta.requirementsText}
                    onChange={(e) =>
                      setMeta({ ...meta, requirementsText: e.target.value })
                    }
                    placeholder={"A computer with a modern browser\nNo paid tools needed"}
                  />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={meta.priceInPaise / 100}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        priceInPaise: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Delivery type</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={meta.deliveryType}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        deliveryType: e.target.value as typeof meta.deliveryType,
                      })
                    }
                  >
                    <option value="SELF_PACED">On-demand (online)</option>
                    <option value="LIVE">Live sessions</option>
                    <option value="OFFLINE">In-person / offline</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Controls student-facing labels. Paid lessons still need
                    enrollment; mark individual lessons as Free Preview for
                    public access.
                  </p>
                </div>
                {staffUsers.length > 0 && (
                  <div>
                    <Label>Instructor</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      value={meta.instructorId}
                      onChange={(e) =>
                        setMeta({ ...meta, instructorId: e.target.value })
                      }
                    >
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div>
                    <Label>Course preview video (landing page)</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Plays from the purchase card (play → large popup). Same
                      provider + src model as lectures (YouTube, Vimeo, or file).
                      Leave empty to fall back to the first Free Preview lecture.
                    </p>
                  </div>
                  <VideoSourceFields
                    idPrefix="trailer"
                    label="Preview"
                    provider={meta.trailerProvider}
                    src={meta.trailerSrc}
                    onProviderChange={(trailerProvider) =>
                      setMeta({ ...meta, trailerProvider })
                    }
                    onSrcChange={(trailerSrc) =>
                      setMeta({ ...meta, trailerSrc })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2 pb-1 sm:col-span-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={meta.published}
                      onChange={(e) =>
                        setMeta({ ...meta, published: e.target.checked })
                      }
                    />
                    Published
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={meta.featured}
                      onChange={(e) =>
                        setMeta({ ...meta, featured: e.target.checked })
                      }
                    />
                    Featured
                  </label>
                </div>
              </div>
              <div className="mt-auto flex justify-end pt-2">
                <Button type="submit" disabled={savingMeta}>
                  <Save className="h-4 w-4" />
                  {savingMeta ? "Saving…" : "Save details"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {tab === "curriculum" && (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Add sections, then nest lessons inside each one.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setSectionTitle("");
                  setSectionOrder(course.sections.length);
                  setSectionModal({ mode: "create" });
                }}
              >
                <Plus className="h-4 w-4" />
                Add section
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {course.sections.length === 0 && (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
                  <p className="font-medium text-foreground">No sections yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a section, then add lessons inside it.
                  </p>
                </div>
              )}

              {course.sections.map((section) => {
                const open = expanded[section.id] !== false;
                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
                      <button
                        type="button"
                        className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [section.id]: !open,
                          }))
                        }
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          <span className="mr-1.5 text-xs text-muted-foreground">
                            #{section.order + 1}
                          </span>
                          {section.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {section.lessons.length} lesson
                          {section.lessons.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLessonForm(emptyLesson);
                          setLessonModal({
                            mode: "create",
                            sectionId: section.id,
                          });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Lesson
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSectionTitle(section.title);
                          setSectionOrder(section.order);
                          setSectionModal({ mode: "edit", section });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteSection(section)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {open && (
                      <div className="overflow-x-auto">
                        {section.lessons.length === 0 ? (
                          <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                            No lessons in this section.
                          </p>
                        ) : (
                          <table className="w-full min-w-[520px] text-left text-sm">
                            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-medium">#</th>
                                <th className="px-3 py-2 font-medium">Lesson</th>
                                <th className="px-3 py-2 font-medium">Type</th>
                                <th className="px-3 py-2 font-medium">Length</th>
                                <th className="px-3 py-2 font-medium">Access</th>
                                <th className="px-3 py-2 text-right font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {section.lessons.map((lesson) => (
                                <tr key={lesson.id} className="hover:bg-muted/40">
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {lesson.order + 1}
                                  </td>
                                  <td className="px-3 py-2 font-medium">
                                    {lesson.title}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant="secondary">
                                      {lesson.type}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                    {lesson.duration > 0
                                      ? formatDuration(lesson.duration)
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {lesson.isPreview ? (
                                      <Badge variant="warning">Preview</Badge>
                                    ) : (
                                      <Badge variant="secondary">Enrolled</Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setLessonForm({
                                            title: lesson.title,
                                            description:
                                              lesson.description ?? "",
                                            type: lesson.type,
                                            videoProvider:
                                              (lesson.videoProvider ??
                                                "YOUTUBE") as VideoProviderValue,
                                            videoSrc: lesson.videoSrc ?? "",
                                            content: lesson.content ?? "",
                                            pdfUrl: lesson.pdfUrl ?? "",
                                            duration: lesson.duration,
                                            isPreview: lesson.isPreview,
                                            order: lesson.order,
                                            resourceTitle:
                                              lesson.resources?.[0]?.title ?? "",
                                            resourceUrl:
                                              lesson.resources?.[0]?.url ?? "",
                                          });
                                          setLessonModal({
                                            mode: "edit",
                                            sectionId: section.id,
                                            lesson,
                                          });
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteLesson(lesson)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!sectionModal}
        onClose={() => setSectionModal(null)}
        title={sectionModal?.mode === "edit" ? "Edit section" : "Add section"}
      >
        <form onSubmit={saveSection} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Order</Label>
            <Input
              type="number"
              min={0}
              value={sectionOrder}
              onChange={(e) => setSectionOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSectionModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sectionSaving}>
              {sectionSaving ? "Saving…" : "Save section"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!lessonModal}
        onClose={() => setLessonModal(null)}
        title={lessonModal?.mode === "edit" ? "Edit lesson" : "Add lesson"}
        className="max-w-xl"
      >
        <form onSubmit={saveLesson} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={lessonForm.description}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={lessonForm.type}
              onChange={(e) =>
                setLessonForm({
                  ...lessonForm,
                  type: e.target.value as LessonForm["type"],
                })
              }
            >
              <option value="VIDEO">Video</option>
              <option value="TEXT">Text / Markdown</option>
              <option value="PDF">PDF</option>
            </Select>
          </div>
          {lessonForm.type === "VIDEO" && (
            <>
              <VideoSourceFields
                provider={lessonForm.videoProvider}
                src={lessonForm.videoSrc}
                onProviderChange={(videoProvider) =>
                  setLessonForm({ ...lessonForm, videoProvider })
                }
                onSrcChange={(videoSrc) =>
                  setLessonForm({ ...lessonForm, videoSrc })
                }
                durationSeconds={lessonForm.duration}
                onDurationChange={(duration) =>
                  setLessonForm({ ...lessonForm, duration })
                }
              />
              <div>
                <Label>Notes (optional markdown)</Label>
                <Textarea
                  rows={3}
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                />
              </div>
            </>
          )}
          {lessonForm.type === "TEXT" && (
            <div>
              <Label>Content (markdown)</Label>
              <Textarea
                rows={8}
                value={lessonForm.content}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, content: e.target.value })
                }
                required
              />
            </div>
          )}
          {lessonForm.type === "PDF" && (
            <>
              <FileUploadField
                label="PDF file / URL"
                kind="pdf"
                value={lessonForm.pdfUrl}
                onChange={(pdfUrl) => setLessonForm({ ...lessonForm, pdfUrl })}
              />
              <div>
                <Label>Notes (optional markdown)</Label>
                <Textarea
                  rows={3}
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
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
                value={lessonForm.duration}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    duration: Number(e.target.value),
                  })
                }
              />
            </div>
            {lessonModal?.mode === "edit" && (
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={lessonForm.order ?? 0}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      order: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={lessonForm.isPreview}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, isPreview: e.target.checked })
              }
            />
            Free preview (public API + learn page without enrollment)
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Resource title (optional)</Label>
              <Input
                placeholder="Worksheet PDF"
                value={lessonForm.resourceTitle}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    resourceTitle: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Resource URL</Label>
              <Input
                placeholder="https://…"
                value={lessonForm.resourceUrl}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, resourceUrl: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLessonModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={lessonSaving}>
              {lessonSaving ? "Saving…" : "Save lesson"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
