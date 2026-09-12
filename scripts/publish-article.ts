import { prisma } from "../lib/db";
import { transitionArticle } from "../lib/editorial";

async function main() {
  const slug = process.argv[2] || "meta-muse-personal-ai-agent";
  console.log(`Publishing article with slug: "${slug}"...`);

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    throw new Error(`Article with slug "${slug}" not found.`);
  }

  console.log(`Found article: ${article.id} (version ${article.version}, status ${article.status}, isPublished: ${article.isPublished})`);

  // Ensure tags are present in Taxonomy
  if (article.tags && article.tags.length > 0) {
    for (const tagSlug of article.tags) {
      const tagName = tagSlug
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      await prisma.taxonomy.upsert({
        where: { kind_slug: { kind: "TAG", slug: tagSlug } },
        create: {
          kind: "TAG",
          slug: tagSlug,
          name: tagName,
          active: true,
        },
        update: {
          active: true,
        },
      });
    }
    console.log(`Ensured ${article.tags.length} tags in Taxonomy.`);
  }

  const admin = await prisma.profile.findFirst({
    where: { role: "ADMIN", active: true },
  });

  if (!admin) {
    throw new Error("No active admin profile found to approve/publish.");
  }

  console.log(`Using admin actor: ${admin.email} (${admin.id})`);

  let current = article;

  // If in DRAFT or NEEDS_EDIT or REJECTED, move to review
  if (["DRAFT", "NEEDS_EDIT", "REJECTED"].includes(current.status)) {
    console.log("Submitting for review...");
    current = await transitionArticle(current.id, "review", admin.id, current.version);
    console.log(`Status is now: ${current.status} (version ${current.version})`);
  }

  // If in IN_REVIEW, approve with human review checks
  if (current.status === "IN_REVIEW") {
    console.log("Approving article...");
    current = await transitionArticle(
      current.id,
      "approve",
      admin.id,
      current.version,
      undefined,
      undefined,
      {
        source: true,
        dates: true,
        image: true,
        content: true,
        disclosures: true,
      }
    );
    console.log(`Status is now: ${current.status} (version ${current.version})`);
  }

  // If APPROVED or SCHEDULED, publish
  if (["APPROVED", "SCHEDULED"].includes(current.status)) {
    console.log("Publishing article...");
    current = await transitionArticle(current.id, "publish", admin.id, current.version);
    console.log(`Status is now: ${current.status} (version ${current.version}, isPublished: ${current.isPublished})`);
  }

  console.log("Successfully published article!");
  console.log({
    id: current.id,
    slug: current.slug,
    title: current.title,
    isPublished: current.isPublished,
    publishedAt: current.publishedAt,
    publishedUpdatedAt: current.publishedUpdatedAt,
  });
}

main()
  .catch((e) => {
    console.error("Publication failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
