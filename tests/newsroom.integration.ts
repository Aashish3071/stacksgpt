import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import pg from "pg";
import sharp from "sharp";
import { postgresConfig } from "../lib/postgres-config";
const schema = `stacksgpt_test_${crypto.randomUUID().replaceAll("-", "")}`;
const base = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!base) throw Error("Set a test Postgres connection in DIRECT_URL.");
const url = new URL(base);
url.searchParams.set("schema", schema);
process.env.DATABASE_URL = url.toString();
process.env.DIRECT_URL = url.toString();
const control = new pg.Client(postgresConfig(base).config);
const fixture = "public/images/articles/newsroom-test.png";
let db: any;
async function main() {
  await control.connect();
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    await control.query(`SET search_path TO "${schema}"`);
    await control.query(
      await readFile(
        "prisma/migrations/202609100000_baseline/migration.sql",
        "utf8",
      ),
    );
    await control.query(
      `INSERT INTO "Subscriber" (id,email) VALUES ('existing','existing@example.test')`,
    );
    await control.query(
      await readFile(
        "prisma/migrations/202609100001_newsroom/migration.sql",
        "utf8",
      ),
    );
    const token = await control.query(
      "SELECT token FROM \"Subscriber\" WHERE id='existing'",
    );
    assert.ok(token.rows[0].token);
    console.log(
      "PASS: additive migration preserves existing subscribers and creates search indexes",
    );
    await sharp({
      create: { width: 1200, height: 630, channels: 3, background: "#ffffff" },
    })
      .png()
      .toFile(fixture);
    db = (await import("../lib/db")).default;
    const { saveDraft, transitionArticle } = await import("../lib/editorial");
    const { publicArticle } = await import("../lib/public-article");
    const { discover } = await import("../lib/discovery");
    const { safeMarkdown, jsonLd } = await import("../lib/safe-markdown");
    const { publicationErrors } = await import("../lib/article-validation");
    const { parseArticleText } = await import("../lib/content");
    await db.profile.create({
      data: {
        id: "editor-test",
        email: "editor@example.test",
        displayName: "Test Editor",
        role: "ADMIN",
      },
    });
    await db.taxonomy.create({
      data: { kind: "CATEGORY", slug: "research", name: "Research" },
    });
    const valid = {
      externalId: "test-newsroom-story",
      sourceHash: "one",
      slug: "test-newsroom-story",
      title: "A clear headline for a test article",
      summary:
        "This is a sufficiently detailed test summary explaining a fictional fixture.",
      verdict: "This is a test verdict, not a claim about an actual product.",
      body: "A fictional article fixture used only inside an isolated test database. ".repeat(
        30,
      ),
      category: "Research",
      type: "NEWS",
      sourceAuthor: "Example",
      sourceUrl: "https://example.com/announcement",
      sourcePublishedAt: "2026-01-01T00:00:00Z",
      retrievedAt: "2026-01-02T12:00:00Z",
      heroImage: "/images/articles/newsroom-test.png",
      heroImageAlt: "A plain white test fixture",
      heroImageCredit: "Test fixture",
      heroImageOrigin: "editorial",
      seoTitle: "A clear headline for a test article",
      metaDescription:
        "This is a detailed test summary for search engines. It is only a fictional fixture used to verify editorial controls.",
      keyPoints: ["Test point one", "Test point two"],
    };
    let a = await saveDraft(valid, null, true);
    assert.equal(a.isPublished, false);
    assert.equal(a.status, "DRAFT");
    assert.equal(a.authorId, null);
    await assert.rejects(() =>
      transitionArticle(a.id, "publish", "editor-test", a.version),
    );
    await assert.rejects(
      () => transitionArticle(a.id, "review", "editor-test", a.version),
      /author/,
    );
    a = await saveDraft(
      { id: a.id, version: a.version, authorId: "editor-test" },
      "editor-test",
    );
    a = await transitionArticle(a.id, "review", "editor-test", a.version);
    await assert.rejects(()=>transitionArticle(a.id,"approve","editor-test",a.version),/human review/);
    a = await transitionArticle(a.id, "approve", "editor-test", a.version,undefined,undefined,{source:true,dates:true,image:true,content:true,disclosures:true});
    a = await transitionArticle(a.id, "publish", "editor-test", a.version);
    const publishedDate = a.publishedUpdatedAt!.toISOString();
    assert.equal(a.isPublished, true);
    console.log(
      "PASS: imports remain private and direct publication is blocked until review and approval",
    );
    a = await saveDraft(
      {
        ...valid,
        title: "Private replacement headline should never leak",
        sourceHash: "two",
      },
      null,
      true,
    );
    assert.equal(a.title, valid.title);
    assert.equal(a.pendingStatus, "DRAFT");
    assert.equal(a.approvedAt, null);
    assert.equal(a.publishedUpdatedAt!.toISOString(), publishedDate);
    assert.ok(
      !JSON.stringify(publicArticle(a)).includes("Private replacement"),
    );
    assert.ok(!("pendingDraft" in publicArticle(a)));
    assert.equal((await discover({ q: "replacement" })).total, 0);
    assert.equal((await discover({ q: "fictional" })).total, 1);
    assert.equal((await discover({ q: "fictional", page: 50 })).total, 1);
    await assert.rejects(() =>
      transitionArticle(a.id, "publish", "editor-test", a.version),
    );
    const version = a.version;
    a = await saveDraft(
      {
        id: a.id,
        version,
        correctionNote: "A reviewed factual correction for the test.",
      },
      "editor-test",
    );
    await assert.rejects(
      () =>
        saveDraft(
          { id: a.id, version, title: "Stale overwrite must be refused" },
          "editor-test",
        ),
      /changed/,
    );
    console.log(
      "PASS: changed imports cannot alter live copy, public timestamps or search; stale saves are refused",
    );
    a = await transitionArticle(a.id, "review", "editor-test", a.version);
    a = await transitionArticle(a.id, "approve", "editor-test", a.version,undefined,undefined,{source:true,dates:true,image:true,content:true,disclosures:true});
    a = await transitionArticle(
      a.id,
      "schedule",
      "editor-test",
      a.version,
      new Date(Date.now() + 3600000).toISOString(),
    );
    await assert.rejects(
      () => transitionArticle(a.id, "publish", "editor-test", a.version),
      /not due/,
    );
    a = await saveDraft(
      { id: a.id, version: a.version, slug: "new-permanent-test-slug" },
      "editor-test",
    );
    a = await transitionArticle(a.id, "review", "editor-test", a.version);
    a = await transitionArticle(a.id, "approve", "editor-test", a.version,undefined,undefined,{source:true,dates:true,image:true,content:true,disclosures:true});
    a = await transitionArticle(a.id, "publish", "editor-test", a.version);
    assert.equal(
      (await db.articleRedirect.findUnique({ where: { slug: valid.slug } }))
        .articleId,
      a.id,
    );
    assert.equal(a.pendingDraft, null);
    assert.equal((await discover({ q: "replacement" })).total, 1);
    const reserved = await saveDraft(
      { ...valid, externalId: "second-article", sourceHash: "new" },
      "editor-test",
    );
    let b = await transitionArticle(
      reserved.id,
      "review",
      "editor-test",
      reserved.version,
    );
    b = await transitionArticle(b.id, "approve", "editor-test", b.version,undefined,undefined,{source:true,dates:true,image:true,content:true,disclosures:true});
    await assert.rejects(
      () => transitionArticle(b.id, "publish", "editor-test", b.version),
      /reserved/,
    );
    assert.ok((await db.articleRevision.count()) >= 10);
    assert.ok((await db.auditLog.count()) >= 10);
    console.log(
      "PASS: scheduling waits for its due time, edits reset approval, redirects retain their owner and history is recorded",
    );
    assert.ok(
      publicationErrors({
        ...valid,
        authorId: "editor-test",
        heroImage: null,
      }).some((x) => x.includes("image")),
    );
    assert.ok(
      publicationErrors({
        ...valid,
        authorId: "editor-test",
        retrievedAt: "2999-01-01",
      }).some((x) => x.includes("future")),
    );
    const cleaned = await safeMarkdown(
      '<script>alert(1)</script><img src=x onerror=alert(1)>[bad](javascript:alert(1))<iframe src="https://evil.example"></iframe>',
    );
    assert.ok(
      !/<(?:script|iframe|img)\b|\sonerror=|href=["']javascript:/i.test(
        cleaned,
      ),
    );
    const unsafeLink = await safeMarkdown("[bad](javascript:alert(1))");
    assert.ok(!/href=["']javascript:/i.test(unsafeLink));
    assert.ok(!jsonLd({ x: "</script>" }).includes("</script>"));
    const bad = parseArticleText(
      "---\ntitle: short\n---\n<script>alert(1)</script>",
      "bad.mdx",
    );
    assert.equal(bad.ok, false);
    console.log(
      "PASS: unsafe markup and invalid submissions are rejected or sanitized",
    );
    console.log(
      "All integration checks passed. No public articles were modified.",
    );
  } finally {
    if (db) await db.$disconnect();
    await unlink(fixture).catch(() => {});
    if (/^stacksgpt_test_[a-f0-9]{32}$/.test(schema))
      await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Integration tests failed");
  process.exitCode = 1;
});
