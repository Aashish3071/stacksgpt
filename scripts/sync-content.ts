import { readFile } from "node:fs/promises";
import path from "node:path";
import { listArticleFiles } from "../lib/content";
import { processImport } from "../lib/importing";
import prisma from "../lib/db";
const dry = process.argv.includes("--dry");
async function main() {
  let failures = 0;
  for (const file of listArticleFiles()) {
    try {
      const result = await processImport(
        await readFile(file, "utf8"),
        path.basename(file),
        { dry },
      );
      console.log(
        `${result.unchanged ? "Unchanged" : dry ? "Valid" : "Imported for review"}: ${result.externalId}`,
      );
    } catch (e) {
      failures++;
      console.error(
        path.basename(file),
        e instanceof Error ? e.message : "Import failed.",
      );
    }
  }
  if (failures) process.exitCode = 1;
}
main()
  .catch(() => {
    console.error("Content sync could not run.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
