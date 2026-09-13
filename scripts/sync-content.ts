import { readFile } from "node:fs/promises";
import path from "node:path";
import { listArticleFiles } from "../lib/content";
import { processImport } from "../lib/importing";
import { listBlueprintFiles } from "../lib/blueprint-content";
import { processBlueprintImport } from "../lib/blueprint-importing";
import prisma from "../lib/db";

const dry = process.argv.includes("--dry");

async function main() {
  let failures = 0;

  // 1. Sync articles
  for (const file of listArticleFiles()) {
    try {
      const result = await processImport(
        await readFile(file, "utf8"),
        path.basename(file),
        { dry },
      );
      console.log(
        `Article ${result.unchanged ? "Unchanged" : dry ? "Valid" : "Imported"}: ${result.externalId}`,
      );
    } catch (e) {
      failures++;
      console.error(
        `Article error in ${path.basename(file)}:`,
        e instanceof Error ? e.message : "Import failed.",
      );
    }
  }

  // 2. Sync blueprints
  for (const file of listBlueprintFiles()) {
    try {
      const result = await processBlueprintImport(
        await readFile(file, "utf8"),
        path.basename(file),
        { dry },
      );
      console.log(
        `Blueprint ${result.unchanged ? "Unchanged" : dry ? "Valid" : "Imported"}: ${result.externalId}`,
      );
    } catch (e) {
      failures++;
      console.error(
        `Blueprint error in ${path.basename(file)}:`,
        e instanceof Error ? e.message : "Import failed.",
      );
    }
  }

  if (failures) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Content sync could not run:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
