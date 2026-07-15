import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blobConfigured } from "@/lib/storage";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      imageUrl: true,
      role: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          How you appear in the app, plus account security.
        </p>
      </header>
      <ProfileForm initialUser={user} uploadsEnabled={blobConfigured()} />
    </div>
  );
}
