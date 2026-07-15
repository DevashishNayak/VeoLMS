import { LearnDestroyGuard } from "@/components/learn/learn-destroy-guard";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LearnDestroyGuard />
      {children}
    </>
  );
}
