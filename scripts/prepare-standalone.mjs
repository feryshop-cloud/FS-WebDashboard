import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("No standalone output found; skipping standalone asset copy.");
  process.exit(0);
}

async function copyIfExists(source, destination) {
  if (!existsSync(source)) return;

  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

await copyIfExists(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);

await copyIfExists(path.join(root, "public"), path.join(standaloneDir, "public"));

console.log("Standalone assets prepared.");
