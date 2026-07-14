"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Course {
  id: string;
  title: string;
  slug: string;
  priceInPaise: number;
  featured: boolean;
  published: boolean;
  sections: { id: string; title: string; lessons: { id: string; title: string }[] }[];
  _count: { enrollments: number };
}

interface Student {
  id: string;
  name: string;
  email: string;
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  user: { name: string; email: string };
  course: { title: string };
}

export default function AdminPage() {
  const [tab, setTab] = useState<"courses" | "students">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    priceInPaise: 49900,
    featured: false,
  });

  const [sectionForm, setSectionForm] = useState({
    courseId: "",
    title: "",
    order: 0,
  });

  const [lessonForm, setLessonForm] = useState({
    sectionId: "",
    title: "",
    youtubeId: "",
    duration: 600,
    order: 0,
    isPreview: false,
  });

  async function loadData() {
    setLoading(true);
    const [coursesRes, studentsRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/students"),
    ]);
    if (coursesRes.ok) {
      const data = await coursesRes.json();
      setCourses(data.courses);
    }
    if (studentsRes.ok) {
      const data = await studentsRes.json();
      setStudents(data.students);
      setEnrollments(data.enrollments);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseForm),
    });
    if (res.ok) {
      setMessage("Course created");
      setCourseForm({ ...courseForm, title: "", description: "" });
      loadData();
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    loadData();
  }

  async function createSection(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionForm),
    });
    setMessage("Section created");
    loadData();
  }

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lessonForm),
    });
    setMessage("Lesson created");
    loadData();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      {message && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}

      <div className="mt-6 flex gap-2">
        <Button
          variant={tab === "courses" ? "default" : "outline"}
          onClick={() => setTab("courses")}
        >
          Courses
        </Button>
        <Button
          variant={tab === "students" ? "default" : "outline"}
          onClick={() => setTab("students")}
        >
          Students & Enrollments
        </Button>
      </div>

      {tab === "courses" && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Course</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createCourse} className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    rows={3}
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input
                    value={courseForm.thumbnail}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, thumbnail: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Price (paise)</Label>
                  <Input
                    type="number"
                    value={courseForm.priceInPaise}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        priceInPaise: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={courseForm.featured}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, featured: e.target.checked })
                    }
                  />
                  Featured
                </label>
                <Button type="submit">Create Course</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Section</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createSection} className="space-y-3">
                <div>
                  <Label>Course</Label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    value={sectionForm.courseId}
                    onChange={(e) =>
                      setSectionForm({ ...sectionForm, courseId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={sectionForm.title}
                    onChange={(e) =>
                      setSectionForm({ ...sectionForm, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={sectionForm.order}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        order: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <Button type="submit">Add Section</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createLesson} className="space-y-3">
                <div>
                  <Label>Section</Label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    value={lessonForm.sectionId}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, sectionId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select section</option>
                    {courses.flatMap((c) =>
                      c.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {c.title} — {s.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <Label>Lesson Title</Label>
                  <Input
                    value={lessonForm.title}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>YouTube Video ID</Label>
                  <Input
                    value={lessonForm.youtubeId}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, youtubeId: e.target.value })
                    }
                    placeholder="e.g. UB1O30fR-EE"
                    required
                  />
                </div>
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={lessonForm.duration}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        duration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lessonForm.isPreview}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, isPreview: e.target.checked })
                    }
                  />
                  Preview lesson (free)
                </label>
                <Button type="submit">Add Lesson</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>All Courses ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-slate-500">
                        {c.sections.length} sections ·{" "}
                        {c.sections.reduce((a, s) => a + s.lessons.length, 0)} lessons ·{" "}
                        {c._count.enrollments} enrollments
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCourse(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "students" && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-slate-500">{s.email}</p>
                  <p className="text-xs text-slate-400">
                    {s._count.enrollments} enrollments
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollments.map((e) => (
                <div key={e.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{e.user.name}</p>
                  <p className="text-slate-500">{e.course.title}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(e.enrolledAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
