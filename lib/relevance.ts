import { IngestedItem } from "./sources/types";

/**
 * Cheap, deterministic relevance scoring.
 *
 * A run can pull well over a hundred items; drafting each one would burn tokens
 * on funding rounds, conference announcements and press-release filler. Scoring
 * first means only the handful most likely to make a useful "here is what you can
 * do with it" article reach the model.
 *
 * No LLM call here on purpose — that would defeat the point.
 */

/** Signals that a story is about something a reader can actually use today. */
const STRONG_SIGNALS = [
  "launch", "launches", "launched", "release", "releases", "released",
  "now available", "generally available", "rolling out", "introduc",
  "new feature", "update", "free tier", "open source", "you can now",
  "hands on", "how to", "guide", "tutorial",
];

/** Named tools and models: concrete subjects make for practical articles. */
const TOOL_SIGNALS = [
  "chatgpt", "openai", "claude", "anthropic", "gemini", "google ai",
  "copilot", "cursor", "perplexity", "midjourney", "notion", "canva",
  "elevenlabs", "runway", "grok", "llama", "mistral", "deepseek",
  "figma", "zapier", "make.com", "n8n",
];

/** Industry noise with nothing for a general reader to act on. */
const NEGATIVE_SIGNALS = [
  "funding round", "series a", "series b", "series c", "valuation",
  "raises $", "ipo", "acquisition", "acquires", "stock", "shares",
  "lawsuit", "sues", "appoints", "hires", "steps down", "resigns",
  "conference", "keynote", "webinar", "earnings", "quarterly results",
];

function countHits(haystack: string, needles: string[]): number {
  return needles.reduce((n, needle) => (haystack.includes(needle) ? n + 1 : n), 0);
}

/** Hours since publication, or a large number when the date is unknown. */
function ageInHours(publishedAt?: Date): number {
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return 72;
  return Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5);
}

/**
 * Returns a score roughly in the 0–10 range. Higher is more worth drafting.
 */
export function scoreItem(item: IngestedItem): number {
  const haystack = `${item.title} ${item.content}`.toLowerCase();

  let score = 0;

  score += Math.min(countHits(haystack, STRONG_SIGNALS), 3) * 1.5;
  score += Math.min(countHits(haystack, TOOL_SIGNALS), 3) * 1.2;
  score -= Math.min(countHits(haystack, NEGATIVE_SIGNALS), 3) * 2.0;

  // Recency: full credit for the last day, tapering off across three days.
  const hours = ageInHours(item.publishedAt);
  if (hours <= 24) score += 2.5;
  else if (hours <= 48) score += 1.5;
  else if (hours <= 72) score += 0.5;
  else score -= 1.0;

  // Enough substance to write from. Very short items produce padded articles.
  const length = item.content.length;
  if (length >= 600) score += 1.5;
  else if (length >= 250) score += 0.75;
  else if (length < 120) score -= 1.5;

  return Number(score.toFixed(2));
}

/** Normalised title hash used to detect the same story across outlets. */
export function contentHash(title: string): string {
  const normalised = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .sort()
    .join("-");

  // Simple, stable, non-cryptographic hash. Collisions here cost us one skipped
  // duplicate, so speed matters more than strength.
  let h = 0;
  for (let i = 0; i < normalised.length; i++) {
    h = (h << 5) - h + normalised.charCodeAt(i);
    h |= 0;
  }
  return `h${(h >>> 0).toString(36)}`;
}

const STOPWORDS = new Set([
  "this", "that", "with", "from", "your", "will", "have", "into", "just",
  "what", "when", "than", "then", "they", "their", "about", "more", "over",
  "here", "your", "been", "were", "being",
]);
