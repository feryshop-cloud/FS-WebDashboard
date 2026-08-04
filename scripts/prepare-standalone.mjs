import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const staticSource = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSource = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

function fail(message) {
  console.error(`[prepare-standalone] ERROR: ${message}`);
  process.exit(1);
}

if (!existsSync(standaloneDir)) {
  fail(
    'standalone output missing (".next/standalone"). Is "output: \'standalone\'" set in next.config?',
  );
}

async function copyRequired(source, destination, label) {
  if (!existsSync(source)) {
    fail(
      `source "${label}" missing (${path.relative(root, source)}). ` +
        "Next.js may have changed its build output structure; refusing to ship without assets.",
    );
  }

  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });

  if (!existsSync(destination)) {
    fail(`failed to copy "${label}" into standalone output (${path.relative(root, destination)}).`);
  }

  console.log(`[prepare-standalone] ${label} -> ${path.relative(root, destination)}`);
}

await copyRequired(staticSource, staticDest, ".next/static");
await copyRequired(publicSource, publicDest, "public");

console.log("[prepare-standalone] standalone assets prepared.");
