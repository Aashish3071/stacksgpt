/** One item pulled from a source, before it becomes a RawNews row. */
export interface IngestedItem {
  externalUrl: string;
  author: string;
  title: string;
  content: string;
  publishedAt?: Date;
}

export interface SourceChannel {
  id: string;
  name: string;
  handleOrUrl: string;
  type: string;
  category: string;
}

/**
 * A source of news. Adding X/Twitter later means implementing this interface in
 * lib/sources/x.ts and registering it — no other code changes.
 */
export interface SourceAdapter {
  type: string;
  /** Must resolve, never throw: one broken feed cannot abort a whole run. */
  fetch(channel: SourceChannel): Promise<IngestedItem[]>;
}

/** Items per channel per run. Keeps a chatty feed from flooding the queue. */
export const MAX_ITEMS_PER_CHANNEL = 8;

/** Characters of source text passed to the LLM. Caps token spend per article. */
export const MAX_CONTENT_CHARS = 4000;
