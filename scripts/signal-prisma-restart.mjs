/**
 * Tell `npm run dev` (scripts/dev.mjs) to regenerate Prisma + restart Next.
 * Safe no-op if the wraper isn't running.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const stamp = join(dirname(fileURLToPath(import.meta.url)), ".prisma-restart");
writeFileSync(stamp, `${Date.now()}\n`);
console.log("[db] Signaled Next restart (if npm run dev is running).");
