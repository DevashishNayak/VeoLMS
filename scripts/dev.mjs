/**
 * Local dev wrapper: runs `next dev` and restarts it after Prisma schema /
 * client changes so a fresh PrismaClient + middleware load automatically.
 *
 * Restart triggers:
 * - edits to prisma/schema.prisma
 * - scripts/.prisma-restart stamp (written by db:push / db:generate)
 */
import { spawn } from "node:child_process";
import { watch, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "prisma", "schema.prisma");
const stampPath = join(root, "scripts", ".prisma-restart");
const scriptsDir = join(root, "scripts");

/**
 * Cursor / some shells inject empty placeholders (AUTH_SECRET="", …).
 * Next.js never overrides existing env keys with `.env`, so Auth.js then
 * throws MissingSecret. Drop blank values so `.env` / `.env.local` can win.
 */
for (const [key, value] of Object.entries(process.env)) {
  if (value === "") delete process.env[key];
}

if (!existsSync(stampPath)) {
  writeFileSync(stampPath, "0\n");
}

let child = null;
let restarting = false;
let debounceTimer = null;

function spawnCmd(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

function waitForExit(proc) {
  return new Promise((resolve) => {
    proc.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

function startNext() {
  child = spawnCmd("npx", ["next", "dev"]);
  child.on("exit", (code, signal) => {
    if (restarting) return;
    // Propagate unexpected exits (Ctrl+C, crash).
    if (signal === "SIGINT" || signal === "SIGTERM") process.exit(0);
    process.exit(code ?? 1);
  });
}

async function stopNext() {
  if (!child || child.killed) return;
  const proc = child;
  child = null;
  proc.kill("SIGTERM");
  const killer = setTimeout(() => {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }, 4000);
  await waitForExit(proc);
  clearTimeout(killer);
}

async function generateClient() {
  const gen = spawnCmd("npx", ["prisma", "generate"]);
  const { code } = await waitForExit(gen);
  if (code !== 0) throw new Error(`prisma generate exited with ${code}`);
}

async function regenerateAndRestart(reason) {
  if (restarting) return;
  restarting = true;
  console.log(`\n[dev] ${reason} — regenerating Prisma client & restarting Next…\n`);
  try {
    await stopNext();
    await generateClient();
    startNext();
  } catch (err) {
    console.error("[dev] Restart failed:", err);
    if (!child) startNext();
  } finally {
    restarting = false;
  }
}

function scheduleRestart(reason) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void regenerateAndRestart(reason);
  }, 500);
}

watch(schemaPath, () => scheduleRestart("prisma/schema.prisma changed"));

if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
watch(scriptsDir, (_event, filename) => {
  if (filename === ".prisma-restart") {
    scheduleRestart("Prisma client sync requested");
  }
});

function shutdown() {
  restarting = true;
  if (child) child.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startNext();
