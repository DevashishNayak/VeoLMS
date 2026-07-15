import { LocalMediaStorage } from "@vidstack/react";

/** Skip writing prefs while we temporarily silence a hidden trailer player. */
let suppressPrefsWrite = false;

export function withSuppressedPlayerPrefs(fn: () => void) {
  suppressPrefsWrite = true;
  try {
    fn();
  } finally {
    const release = () => {
      suppressPrefsWrite = false;
    };
    if (typeof window === "undefined") release();
    else window.setTimeout(release, 0);
  }
}

/**
 * Persist volume / speed / captions — not playback position (that’s LessonProgress).
 * Temporary trailer mute must not poison this store (see withSuppressedPlayerPrefs).
 */
export class VeoPlayerPrefsStorage extends LocalMediaStorage {
  override async getTime(): Promise<number | null> {
    return null;
  }

  override async setTime(): Promise<void> {
    // no-op — progress is saved via /api/progress
  }

  override async setMuted(muted: boolean): Promise<void> {
    if (suppressPrefsWrite) return;
    return super.setMuted(muted);
  }

  override async setVolume(volume: number): Promise<void> {
    if (suppressPrefsWrite) return;
    return super.setVolume(volume);
  }
}

/** Shared singleton so prefs apply to every LMS player instance. */
export const veoPlayerPrefsStorage = new VeoPlayerPrefsStorage();

const PREFS_KEY = "veolms-player";

/**
 * Clear a stuck `muted: true` left over from trailer close (before suppress existed).
 * Call once on the client.
 */
export function repairPlayerMutePref() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.muted === true) {
      data.muted = false;
      localStorage.setItem(PREFS_KEY, JSON.stringify(data));
    }
  } catch {
    /* ignore corrupt prefs */
  }
}
