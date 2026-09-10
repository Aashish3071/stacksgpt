import { IngestedItem, SourceAdapter, SourceChannel } from "./types";

/**
 * X / Twitter adapter — deliberately inert.
 *
 * X has no free read tier. Turning this on means either the official API
 * (paid) or a third-party scraper (cheaper, ToS-grey, breaks without warning).
 * That decision is deferred, so this returns nothing and the rest of the
 * pipeline runs on RSS, newsletter and YouTube sources.
 *
 * To enable later, implement fetch() to return IngestedItem[] and nothing else
 * in the codebase needs to change. Most accounts worth following (OpenAI,
 * Anthropic, Google DeepMind and the major newsletters) also publish an RSS
 * feed, so prefer adding those as RSS channels first.
 */
export const xAdapter: SourceAdapter = {
  type: "TWITTER",
  async fetch(channel: SourceChannel): Promise<IngestedItem[]> {
    console.warn(
      `[x] Skipping "${channel.name}": no X adapter configured. ` +
        `Add an RSS equivalent for this source, or implement lib/sources/x.ts.`
    );
    return [];
  },
};
