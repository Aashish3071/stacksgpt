import prisma from "../lib/db";
import { SEED_CHANNELS, SEED_TOOLS } from "../lib/seed-data";

async function main() {
  console.log("Seeding AI Updates database...");

  // 1. Seed Channels
  for (const ch of SEED_CHANNELS) {
    await prisma.channel.upsert({
      where: { handleOrUrl: ch.handleOrUrl },
      update: {},
      create: ch,
    });
  }
  console.log(`✓ Seeded ${SEED_CHANNELS.length} channels`);

  // 2. Seed Tools & Affiliate Registry
  for (const tool of SEED_TOOLS) {
    await prisma.toolAffiliate.upsert({
      where: { slug: tool.slug },
      update: {},
      create: tool,
    });
  }
  console.log(`✓ Seeded ${SEED_TOOLS.length} affiliate tools`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
