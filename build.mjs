import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const sources = ["index.html", "styles.css", "script.js", "core.mjs", "assets"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const source of sources) {
  await cp(resolve(root, source), resolve(output, source), { recursive: true });
}
console.log(`Built static prototype to ${output}`);
