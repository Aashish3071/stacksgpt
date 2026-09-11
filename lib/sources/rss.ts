import { validateFeedUrl } from "../security";
import Parser from "rss-parser";
import {
  IngestedItem,
  MAX_CONTENT_CHARS,
  MAX_ITEMS_PER_CHANNEL,
  SourceAdapter,
  SourceChannel,
} from "./types";

// YouTube and Media RSS put the real description in custom fields.
const parser: Parser<
  Record<string, unknown>,
  Record<string, unknown>
> = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "DecodedAI-NewsBot/1.0 (+https://github.com/; contact via site)",
  },
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["media:description", "mediaDescription"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

/** Strips HTML tags and collapses whitespace so the LLM sees clean prose. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Feed dialects disagree about `author`: RSS gives a string, Atom (blog.google,
 * for one) gives an object like { name: ["Jane Doe"], title: ["PM"] }. Coerce
 * everything to a plain display string.
 */
function normaliseAuthor(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return normaliseAuthor(value[0]);
  if (value && typeof value === "object") {
    const name = (value as Record<string, unknown>).name;
    if (name) return normaliseAuthor(name);
  }
  return "";
}

/** Pulls the best available body text from an item across feed dialects. */
function extractContent(item: Record<string, any>): string {
  const mediaGroup = item.mediaGroup as Record<string, any> | undefined;
  const youtubeDescription =
    mediaGroup?.["media:description"]?.[0] ?? item.mediaDescription ?? "";

  const candidates = [
    item.contentSnippet,
    youtubeDescription,
    item.contentEncoded,
    item.content,
    item.summary,
    item.description,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 40) {
      return stripHtml(candidate).slice(0, MAX_CONTENT_CHARS);
    }
  }

  // Fall back to whatever short text exists rather than dropping the item.
  const fallback = candidates.find((c) => typeof c === "string" && c.trim());
  return typeof fallback === "string"
    ? stripHtml(fallback).slice(0, MAX_CONTENT_CHARS)
    : "";
}

export async function fetchRssFeed(
  feedUrl: string,
  fallbackAuthor = "",
): Promise<IngestedItem[]> {
  await validateFeedUrl(feedUrl);
  const response = await fetch(feedUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error(`Feed returned ${response.status}`);
  const reader = response.body!.getReader();
  let text = "",
    size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1500000) {
      await reader.cancel();
      throw Error("Feed too large");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw Error("External XML entities are not permitted");
  const feed = await parser.parseString(text);

  return (feed.items || [])
    .slice(0, MAX_ITEMS_PER_CHANNEL)
    .map((item: Record<string, any>) => {
      const link = item.link || item.guid;
      if (!link) return null;

      const published = item.isoDate || item.pubDate;

      return {
        externalUrl: String(link),
        author:
          normaliseAuthor(item.creator) ||
          normaliseAuthor(item.author) ||
          fallbackAuthor ||
          normaliseAuthor(feed.title) ||
          "Unknown source",
        title: (item.title || "").trim(),
        content: extractContent(item),
        publishedAt: published ? new Date(published) : undefined,
      } as IngestedItem;
    })
    .filter((item): item is IngestedItem => Boolean(item?.title));
}

export const rssAdapter: SourceAdapter = {
  type: "RSS",
  async fetch(channel: SourceChannel): Promise<IngestedItem[]> {
    try {
      return await fetchRssFeed(channel.handleOrUrl, channel.name);
    } catch (error) {
      // A dead feed must not abort the run; the caller logs and continues.
      console.error(
        `[rss] ${channel.name} (${channel.handleOrUrl}) failed:`,
        error,
      );
      throw error;
    }
  },
};
