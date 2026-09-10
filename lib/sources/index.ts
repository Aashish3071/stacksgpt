import { SourceAdapter, SourceChannel, IngestedItem } from "./types";
import { rssAdapter } from "./rss";
import { xAdapter } from "./x";

export * from "./types";

/**
 * Channel type → adapter. Newsletter and YouTube feeds are RSS underneath, so
 * they share the RSS adapter and differ only as an editorial label.
 */
const ADAPTERS: Record<string, SourceAdapter> = {
  RSS: rssAdapter,
  SUBSTACK: rssAdapter,
  NEWSLETTER: rssAdapter,
  YOUTUBE: rssAdapter,
  TWITTER: xAdapter,
};

export function adapterFor(type: string): SourceAdapter | null {
  return ADAPTERS[(type || "").toUpperCase()] ?? null;
}

export async function fetchChannel(channel: SourceChannel): Promise<IngestedItem[]> {
  const adapter = adapterFor(channel.type);
  if (!adapter) {
    console.warn(`[sources] No adapter for channel type "${channel.type}" (${channel.name})`);
    return [];
  }
  return adapter.fetch(channel);
}
