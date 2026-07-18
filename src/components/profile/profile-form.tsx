"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  role: string;
};

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "INSTRUCTOR") return "Instructor";
  return "Student";
}

export function ProfileForm({
  initialUser,
  uploadsEnabled,
}: {
  initialUser: ProfileUser;
  uploadsEnabled: boolean;
}) {
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [imageUrl, setImageUrl] = useState(initialUser.imageUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewSrc = imageUrl.trim() || user.imageUrl || "";
  const initial = useMemo(
    () => (name.trim().charAt(0) || user.email.charAt(0) || "?").toUpperCase(),
    [name, user.email]
  );

  async function refreshSession(next: ProfileUser) {
    await update({
      name: next.name,
      image: next.imageUrl,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          imageUrl: imageUrl.trim() || null,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setUser(data.user);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile saved");
      await refreshSession(data.user);
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setUser(data.user);
      setImageUrl(data.user.imageUrl ?? "");
      setMessage("Photo updated");
      await refreshSession(data.user);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start"
    >
      {/* Identity + photo */}
      <aside className="rounded-xl border border-border bg-gradient-to-b from-emerald-50/80 to-card p-4 lg:sticky lg:top-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-primary/15 ring-4 ring-white shadow-sm">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-900">
                  {initial}
                </span>
              )}
            </div>
            {uploadsEnabled ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) =>
                    void onAvatarChange(e.target.files?.[0] ?? null)
                  }
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-0.5 -right-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
                  aria-label={uploading ? "Uploading photo" : "Upload photo"}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
          </div>

          <h2 className="mt-3 w-full truncate text-base font-semibold tracking-tight text-foreground">
            {name.trim() || "Your name"}
          </h2>
          <p className="mt-0.5 flex w-full items-center justify-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
            {roleLabel(user.role)}
          </span>

          {uploadsEnabled ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-xs font-medium text-emerald-800 hover:underline disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-1.5 text-left">
          <Label htmlFor="imageUrl" className="text-xs">
            Photo URL
          </Label>
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 text-sm"
          />
        </div>
      </aside>

      {/* Settings */}
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-900">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">About you</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="bio">Bio</Label>
                <span className="text-xs text-muted-foreground">
                  {bio.length}/2000
                </span>
              </div>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="A short bio for your profile and courses."
                className="flex min-h-[5.5rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-800">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Password</h3>
              <p className="text-xs text-muted-foreground">
                Leave blank to keep your current password.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[1.25rem] text-sm">
            {error ? <p className="text-destructive">{error}</p> : null}
            {message ? (
              <p className="font-medium text-emerald-700">{message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={saving} className="sm:min-w-[8.5rem]">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
