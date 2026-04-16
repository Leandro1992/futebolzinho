import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectDir = process.cwd();
const sourceDir = resolve(projectDir, "out");
const targetDir = resolve(projectDir, "..", "..", "public", "front-next");

if (!existsSync(sourceDir)) {
  console.error("Build export not found in 'out'. Run Next build first.");
  process.exit(1);
}

mkdirSync(resolve(projectDir, "..", "..", "public"), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Static build copied to: ${targetDir}`);
