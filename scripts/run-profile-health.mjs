#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const jobs = [
  ["GBP profile", ["scripts/manage-google-profile.mjs"]],
  ["site health", ["scripts/audit-site.mjs", "--production"]]
];
let failed = 0;
for (const [label, jobArgs] of jobs) {
  const result = spawnSync(process.execPath, jobArgs, { cwd: root, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) { failed += 1; console.error(`${label} exited ${result.status}.`); }
}
if (failed) process.exit(1);
console.log("Mayberry weekly profile and site health audit complete.");
