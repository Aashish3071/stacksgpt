import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { TEMPLATE_ENTRIES } from "../content/templates/catalog";
import { listTemplates, TEMPLATE_CATEGORIES } from "../lib/templates";
import { BLUEPRINT_ROLES } from "../lib/site";

const ROOT = process.cwd();
const WORKFLOW_DIR = path.join(ROOT, "content", "templates", "workflows");

function runTests() {
  console.log("Running workflow template catalog tests...");

  const slugs = TEMPLATE_ENTRIES.map((t) => t.slug);
  assert.strictEqual(new Set(slugs).size, slugs.length, "Template slugs must be unique.");

  const sources: { slug: string; title: string }[] = JSON.parse(
    fs.readFileSync(path.join(ROOT, "content", "templates", "sources.json"), "utf8"),
  );
  assert.deepStrictEqual(
    [...slugs].sort(),
    sources.map((s) => s.slug).sort(),
    "Catalog and sources.json must list the same templates.",
  );

  const blueprintSlugs = new Set(
    fs
      .readdirSync(path.join(ROOT, "content", "blueprints"))
      .map((f) => fs.readFileSync(path.join(ROOT, "content", "blueprints", f), "utf8"))
      .map((raw) => raw.match(/^slug:\s*"([^"]+)"/m)?.[1])
      .filter(Boolean),
  );

  const categorySlugs = new Set<string>(TEMPLATE_CATEGORIES.map((c) => c.slug));
  const roleSlugs = new Set<string>(BLUEPRINT_ROLES.map((r) => r.slug));

  for (const entry of TEMPLATE_ENTRIES) {
    const where = `template "${entry.slug}"`;
    assert.ok(categorySlugs.has(entry.category), `${where} has an unknown category.`);
    assert.ok(entry.roles.length > 0 && entry.roles.every((r) => roleSlugs.has(r)), `${where} has invalid roles.`);
    assert.ok(entry.howItWorks.length >= 3, `${where} needs at least three how it works steps.`);
    assert.ok(entry.youNeed.length > 0 && entry.staysManual.length > 0 && entry.watchOuts.length > 0, `${where} has empty sections.`);
    assert.strictEqual(entry.title, sources.find((s) => s.slug === entry.slug)?.title, `${where} title differs from sources.json.`);
    for (const bp of entry.blueprints ?? []) {
      assert.ok(blueprintSlugs.has(bp), `${where} links to missing blueprint "${bp}".`);
    }

    const editorial = [
      entry.title, entry.summary, entry.problem, entry.useCase,
      ...entry.howItWorks, ...entry.youNeed, ...entry.staysManual, ...entry.watchOuts,
    ].join("\n");
    assert.ok(!/\d/.test(editorial), `${where} contains a digit. Numbers must be verified before they are published.`);
    assert.ok(!/[—–]/.test(editorial), `${where} contains an em or en dash.`);
    assert.ok(!/n8n/i.test(editorial), `${where} names the runner in listing copy.`);

    const workflowPath = path.join(WORKFLOW_DIR, `${entry.slug}.json`);
    assert.ok(fs.existsSync(workflowPath), `${where} has no workflow file. Run npm run templates:build.`);
    const raw = fs.readFileSync(workflowPath, "utf8");
    const workflow = JSON.parse(raw);
    assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, `${where} workflow has no nodes.`);
    assert.ok(!raw.includes('"credentials"'), `${where} workflow still contains credentials.`);
    assert.ok(!raw.includes('"pinData"'), `${where} workflow still contains pinned sample data.`);
    const emails = raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    assert.ok(emails.every((e) => /@example\.(com|org)$/i.test(e)), `${where} workflow contains a real email address.`);
    assert.ok(!/sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}/.test(raw), `${where} workflow contains an API key.`);
  }

  for (const template of listTemplates()) {
    assert.ok(template.triggers.length > 0, `template "${template.slug}" has no detectable trigger.`);
  }

  console.log(`✔ ${TEMPLATE_ENTRIES.length} templates passed catalog, copy and sanitization checks.`);
}

runTests();
