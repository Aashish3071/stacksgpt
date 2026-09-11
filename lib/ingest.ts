import prisma from "./db";
import { fetchChannel, IngestedItem, SourceChannel } from "./sources";
import { contentHash, scoreItem, scoreComponents } from "./relevance";

import { publicUrl } from "./security";

export interface IngestionReport {
  channelsChecked: number;
  channelsFailed: string[];
  itemsFetched: number;
  itemsStored: number;
  duplicatesSkipped: number;
  itemsRejected: number;
}

/**
 * Pass 1 — collect. Reads every active channel and stores new items as PENDING.
 * Never throws for a single bad feed; a broken source is reported, not fatal.
 */
export async function runIngestion(): Promise<IngestionReport> {
  const channels = await prisma.channel.findMany({
    where: {
      isActive: true,
      pollingEnabled: true,
      type: { in: ["RSS", "SUBSTACK", "YOUTUBE"] },
    },
    orderBy: { lastFetchedAt: { sort: "asc", nulls: "first" } },
    take: 3,
  });

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
      await prisma.channel.update({
        where: { id: channel.id },
        data: { lastFetchedAt: new Date(), lastError: "Feed fetch failed" },
      });
      continue;
    }

    report.itemsFetched += items.length;

    for (const item of items) {
      if (
        !publicUrl(item.externalUrl) ||
        (item.publishedAt &&
          (!Number.isFinite(item.publishedAt.getTime()) ||
            item.publishedAt > new Date()))
      ) {
        report.itemsRejected++;
        continue;
      }
      const canonical = new URL(item.externalUrl);
      canonical.hash = "";
      for (const k of [...canonical.searchParams.keys()])
        if (/^utm_|^(fbclid|gclid|ref)$/i.test(k))
          canonical.searchParams.delete(k);
      canonical.searchParams.sort();
      item.externalUrl = canonical.toString();
      const hash = contentHash(item.title);

      // Two dedup layers: the exact URL, and the normalised title hash that
      // catches the same story republished by another outlet.
      const existing = await prisma.rawNews.findFirst({
        where: {
          OR: [{ externalUrl: item.externalUrl }, { contentHash: hash }],
        },
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
            ...scoreComponents(item),
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
          console.error(
            `[ingest] rejected "${item.title}":`,
            error?.message || error,
          );
          report.itemsRejected += 1;
        }
      }
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
      },
    });
  }

  return report;
}
