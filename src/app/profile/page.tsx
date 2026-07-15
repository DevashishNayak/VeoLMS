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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Your profile
      </h1>
      <p className="mt-1 text-muted-foreground">
        Update your name, photo, bio, and password.
      </p>
      <div className="mt-8">
        <ProfileForm
          initialUser={user}
          uploadsEnabled={blobConfigured()}
        />
      </div>
    </div>
  );
}
