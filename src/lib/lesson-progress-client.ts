/** Client helper for `/api/progress` — omit `completed` unless intentionally set. */

export async function postLessonProgress(input: {
  lessonId: string;
  watchedSeconds: number;
  completed?: boolean;
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    lessonId: input.lessonId,
    watchedSeconds: input.watchedSeconds,
  };
  if (input.completed !== undefined) {
    body.completed = input.completed;
  }

  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}
