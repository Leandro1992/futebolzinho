import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";

const apiDir = resolve("app/api");
const holdDir = resolve("app/_api_hold");

if (!existsSync(apiDir)) {
  console.error("Pasta app/api nao encontrada.");
  process.exit(1);
}

renameSync(apiDir, holdDir);

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_EXPORT: "1" },
});

renameSync(holdDir, apiDir);
process.exit(result.status ?? 1);
