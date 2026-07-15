/**
 * Resume position for a lecture. Never park the playhead in the last few
 * seconds or past 95% — that leaves the user on the end screen so "replay"
 * looks like a full reload when the embed seeks/starts again.
 */
export function resumeWatchSeconds(
  watched: number,
  durationHint?: number | null
): number {
  if (!Number.isFinite(watched) || watched <= 0) return 0;
  const d = durationHint && durationHint > 0 ? durationHint : null;
  if (d != null) {
    if (watched >= d - 5 || watched / d >= 0.95) return 0;
    return Math.min(watched, Math.max(0, d - 1));
  }
  return watched;
}
