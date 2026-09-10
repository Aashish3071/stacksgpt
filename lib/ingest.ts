import prisma from "./db";
import { fetchChannel, IngestedItem, SourceChannel } from "./sources";
import { contentHash, scoreItem } from "./relevance";
import { transformRawUpdateToArticle } from "./ai-writer";
import { matchAffiliateTool } from "./affiliate-engine";

/** Default number of stories drafted per run. Each one costs an LLM call. */
export const DEFAULT_DRAFT_LIMIT = 8;

export interface IngestionReport {
  channelsChecked: number;
  channelsFailed: string[];
  itemsFetched: number;
  itemsStored: number;
  duplicatesSkipped: number;
  itemsRejected: number;
}

export interface DraftingReport {
  /** True when no GEMINI_API_KEY is set, so nothing was written. */
  skipped: boolean;
  attempted: number;
  drafted: number;
  failed: number;
  slugs: string[];
}

/**
 * Pass 1 — collect. Reads every active channel and stores new items as PENDING.
 * Never throws for a single bad feed; a broken source is reported, not fatal.
 */
export async function runIngestion(): Promise<IngestionReport> {
  const channels = await prisma.channel.findMany({ where: { isActive: true } });

  const report: IngestionReport = {
    channelsChecked: channels.length,
    channelsFailed: [],
    itemsFetched: 0,
    itemsStored: 0,
    duplicatesSkipped: 0,
    itemsRejected: 0,
  };

  for (const channel of channels) {
    let items: IngestedItem[] = [];

    try {
      items = await fetchChannel(channel as SourceChannel);
    } catch (error) {
      console.error(`[ingest] channel "${channel.name}" threw:`, error);
      report.channelsFailed.push(channel.name);
      continue;
    }

    report.itemsFetched += items.length;

    for (const item of items) {
      const hash = contentHash(item.title);

      // Two dedup layers: the exact URL, and the normalised title hash that
      // catches the same story republished by another outlet.
      const existing = await prisma.rawNews.findFirst({
        where: { OR: [{ externalUrl: item.externalUrl }, { contentHash: hash }] },
        select: { id: true },
      });

      if (existing) {
        report.duplicatesSkipped += 1;
        continue;
      }

      try {
        await prisma.rawNews.create({
          data: {
            channelId: channel.id,
            externalUrl: item.externalUrl,
            author: item.author,
            title: item.title,
            rawText: item.content,
            contentHash: hash,
            score: scoreItem(item),
            publishedAt: item.publishedAt ?? null,
            status: "PENDING",
          },
        });
        report.itemsStored += 1;
      } catch (error: any) {
        if (error?.code === "P2002") {
          // Unique constraint: lost a race with a concurrent run. A real duplicate.
          report.duplicatesSkipped += 1;
        } else {
          // Malformed item. Count it honestly rather than hiding it as a dup.
          console.error(`[ingest] rejected "${item.title}":`, error?.message || error);
          report.itemsRejected += 1;
        }
      }
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastFetchedAt: new Date() },
    });
  }

  return report;
}

/**
 * Pass 2 — draft. Takes the highest-scoring pending items and turns each into a
 * DRAFT article. Nothing here publishes: a human approves in the admin panel.
 */
export async function runDrafting(limit = DEFAULT_DRAFT_LIMIT): Promise<DraftingReport> {
  // The built-in writer is optional. With articles authored externally and
  // committed as MDX, ingestion runs purely to collect scored story leads.
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim().length < 6) {
    return { skipped: true, attempted: 0, drafted: 0, failed: 0, slugs: [] };
  }

  const pending = await prisma.rawNews.findMany({
    where: { status: "PENDING" },
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: { channel: true },
  });

  const report: DraftingReport = { skipped: false, attempted: pending.length, drafted: 0, failed: 0, slugs: [] };

  for (const item of pending) {
    try {
      const sourceText = [item.title, item.rawText].filter(Boolean).join("\n\n");

      const decoded = await transformRawUpdateToArticle(
        sourceText,
        item.externalUrl,
        item.author
      );

      // Match against tools already in the registry. Never invents one.
      const tool = await matchAffiliateTool(decoded.toolName, decoded.toolCategory);

      const article = await prisma.article.create({
        data: {
          title: decoded.title,
          slug: await uniqueSlug(decoded.title),
          originalTitle: item.title,
          summary: decoded.summary,
          category: decoded.toolCategory || item.channel.category || "Productivity",
          keyPoints: JSON.stringify(decoded.keyPoints),
          body: decoded.body,
          jargonBuster: JSON.stringify(decoded.jargonTranslations || []),
          useCases: JSON.stringify(decoded.useCases || []),
          verdict: decoded.verdict,
          readingMinutes: estimateReadingMinutes(decoded),
          primaryToolId: tool?.toolId ?? null,
          sourceAuthor: item.author,
          sourceUrl: item.externalUrl,
          rawNewsId: item.id,
          // Drafts only. Publication is a human decision.
          status: "DRAFT",
          isPublished: false,
          publishedAt: null,
        },
      });

      await prisma.rawNews.update({
        where: { id: item.id },
        data: { status: "PROCESSED" },
      });

      report.drafted += 1;
      report.slugs.push(article.slug);
    } catch (error) {
      console.error(`[draft] failed for "${item.title}":`, error);
      await prisma.rawNews.update({ where: { id: item.id }, data: { status: "FAILED" } });
      report.failed += 1;
    }
  }

  return report;
}

/** Slugifies a title and guarantees uniqueness without a timestamp suffix. */
async function uniqueSlug(title: string): Promise<string> {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "untitled";

  let candidate = base;
  for (let n = 2; n < 50; n++) {
    const clash = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Rough read time from the generated payload, at ~200 words per minute. */
function estimateReadingMinutes(decoded: {
  summary: string;
  verdict: string;
  keyPoints?: string[];
  body?: string;
}): number {
  const text = [
    decoded.summary,
    decoded.verdict,
    ...(decoded.keyPoints || []),
    decoded.body || "",
  ].join(" ");

  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}
