import { LearnDestroyGuard } from "@/components/learn/learn-destroy-guard";

/**
 * Sync localStorage → cookie before paint so server loading skeletons can
 * read the collapsed course-content preference on the next request.
 */
const SIDEBAR_BOOT =
  "(function(){try{var k='veolms:learn-sidebar';var c='veolms-learn-sidebar';var v=localStorage.getItem(k);if(v==='0'||v==='1'){document.cookie=c+'='+v+';path=/;max-age=31536000;samesite=lax';}}catch(e){}})();";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SIDEBAR_BOOT }} />
      <LearnDestroyGuard />
      {children}
    </>
  );
}
