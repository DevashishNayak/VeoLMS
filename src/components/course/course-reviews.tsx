"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  user: { name: string };
};

export function CourseReviews({
  courseId,
  ratingAvg,
  ratingCount,
  reviews,
  canReview,
  initialUserRating,
}: {
  courseId: string;
  ratingAvg: number;
  ratingCount: number;
  reviews: Review[];
  canReview: boolean;
  initialUserRating?: number | null;
}) {
  const [rating, setRating] = useState(initialUserRating ?? 0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [list, setList] = useState(reviews);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Choose a star rating");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save review");
      return;
    }
    setMessage("Thanks — your review was saved");
    setList((prev) => {
      const others = prev.filter((r) => r.id !== data.review.id);
      return [
        {
          ...data.review,
          user: { name: "You" },
        },
        ...others,
      ];
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Student feedback</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {ratingCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {ratingAvg.toFixed(1)}
                </span>
                <span>
                  · {ratingCount} rating{ratingCount === 1 ? "" : "s"}
                </span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
          </p>
        </div>
      </div>

      {canReview ? (
        <form onSubmit={submit} className="mt-5 space-y-3 border-t border-border pt-5">
          <p className="text-sm font-medium">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} stars`}
                onClick={() => setRating(n)}
                className="rounded p-0.5"
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    n <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? (optional)"
            maxLength={2000}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button type="submit" disabled={saving} size="sm">
            {saving ? "Saving…" : "Submit review"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-4">
        {list.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Be the first to leave a review after enrolling.
          </li>
        ) : (
          list.map((r) => (
            <li key={r.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "h-3.5 w-3.5",
                        n <= r.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{r.user.name}</span>
              </div>
              {r.comment ? (
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
