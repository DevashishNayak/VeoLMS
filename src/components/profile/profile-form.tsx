"use client";

import { FormEvent, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  role: string;
};

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

  const initial = (user.name.trim().charAt(0) || "?").toUpperCase();

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-primary/20 ring-2 ring-primary/30">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-foreground">
              {initial}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Profile photo</p>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Set <code className="text-[11px]">BLOB_READ_WRITE_TOKEN</code> to
              upload, or paste an image URL below.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled />
          <p className="text-xs text-muted-foreground">
            Email changes require verification — coming with OTP signup.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Tell learners a bit about you (instructors: shown on your courses)"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Photo URL (optional)</Label>
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">
          Change password
        </h2>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
