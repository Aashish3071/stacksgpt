import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { parseBlueprintFile, parseBlueprintText } from "../lib/blueprint-content";

function runTests() {
  console.log("Running Blueprint parser tests...");

  // 1. Valid fixture
  const validPath = path.join(process.cwd(), "tests", "fixtures", "blueprint-valid.mdx");
  const validResult = parseBlueprintFile(validPath, { checkLocalFiles: false });
  assert.strictEqual(validResult.ok, true, "Valid fixture should pass parsing.");
  if (validResult.ok) {
    assert.strictEqual(validResult.blueprint.slug, "test-inbox-manager-agent");
    assert.strictEqual(validResult.blueprint.goal, "manage-email-and-admin");
    assert.ok(validResult.blueprint.freeBody.includes("The Problem"));
    assert.ok(validResult.blueprint.gatedBody.includes("Build It Step by Step"));
    assert.ok(!validResult.blueprint.freeBody.includes("Technical Details"));
    console.log("✔ Valid blueprint fixture passed cleanly.");
  }

  // 2. Invalid fixture
  const invalidPath = path.join(process.cwd(), "tests", "fixtures", "blueprint-invalid.mdx");
  const invalidResult = parseBlueprintFile(invalidPath, { checkLocalFiles: false });
  assert.strictEqual(invalidResult.ok, false, "Invalid fixture should fail parsing.");
  if (!invalidResult.ok) {
    const errs = invalidResult.failure.errors;
    assert.ok(errs.some((e) => e.includes("Em dashes are forbidden")), "Should catch em dash");
    assert.ok(errs.some((e) => e.includes("`title` must be at least")), "Should catch short title");
    assert.ok(errs.some((e) => e.includes("`slug` must be lowercase")), "Should catch invalid slug");
    assert.ok(errs.some((e) => e.includes("`goal` must be one of")), "Should catch invalid goal");
    assert.ok(errs.some((e) => e.includes("Missing or out of order H2")), "Should catch missing H2 sections");
    console.log(`✔ Invalid blueprint fixture caught ${errs.length} errors as expected.`);
  }

  // 3. Paid sections placed before the gate are rejected
  const validRaw = fs.readFileSync(validPath, "utf8");
  const leakedRaw = validRaw
    .replace("<!-- gate -->\n", "")
    .replace("## Copy-Paste Prompt", "<!-- gate -->\n\n## Copy-Paste Prompt");
  const leakedResult = parseBlueprintText(leakedRaw, "leaked.mdx", { checkLocalFiles: false });
  assert.strictEqual(leakedResult.ok, false, "Setup steps before the gate should fail.");
  if (!leakedResult.ok) {
    assert.ok(
      leakedResult.failure.errors.some((e) => e.includes('"## Build It Step by Step" must be after')),
      "Should catch gated section placed before the gate",
    );
    console.log("✔ Gated sections placed before the gate are rejected.");
  }

  console.log("All Blueprint validator tests passed!");
}

runTests();
