/**
 * Seed data.
 *
 * Tools carry NO affiliate URL, discount code, badge or rating. Those must only
 * ever be entered by hand after a real partner agreement exists — inventing them
 * misleads readers and fails ad-network review. Every entry here is a plain
 * editorial listing pointing at the tool's real public site.
 *
 * There are deliberately no seed ARTICLES. The three that used to live here were
 * hand-written for the mockup but carried real-looking attributions to sources
 * they were never derived from. Articles now come from content/articles/ only.
 */

export const SEED_CHANNELS = [
  // Every feed below was fetched and confirmed to return items. Feeds that were
  // in the original seed but 404'd (The Rundown AI, AI Breakfast, the Matt Wolfe
  // channel id) have been removed rather than left to fail on every run.
  //
  // X/Twitter handles are intentionally absent: there is no free read access, so
  // the adapter in lib/sources/x.ts is a stub. Where an X account matters, add
  // its blog/RSS equivalent here instead.
  {
    name: "OpenAI Blog",
    handleOrUrl: "https://openai.com/blog/rss.xml",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "Google DeepMind",
    handleOrUrl: "https://deepmind.google/blog/rss.xml",
    type: "RSS",
    category: "Research",
  },
  {
    name: "Google AI Blog",
    handleOrUrl: "https://blog.google/technology/ai/rss/",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "TechCrunch AI",
    handleOrUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "Ars Technica AI",
    handleOrUrl: "https://arstechnica.com/ai/feed/",
    type: "RSS",
    category: "Research",
  },
  {
    name: "The Verge AI",
    handleOrUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "MIT Technology Review AI",
    handleOrUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    type: "RSS",
    category: "Research",
  },
  {
    name: "Simon Willison",
    handleOrUrl: "https://simonwillison.net/atom/everything/",
    type: "RSS",
    category: "Coding",
  },
  {
    name: "Two Minute Papers",
    handleOrUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    type: "YOUTUBE",
    category: "Research",
  },
];

export const SEED_TOOLS = [
  {
    name: "Perplexity AI",
    slug: "perplexity-ai",
    aliases: JSON.stringify(["perplexity", "perplexity ai", "perplexity pro"]),
    tagline: "The AI search engine that reads the web and writes cited answers",
    description: "Replaces traditional Google search with instant, cited syntheses from live web pages, research papers, and forum discussions.",
    category: "Research",
    pricingModel: "Freemium ($20/mo Pro)",
    websiteUrl: "https://perplexity.ai",
  },
  {
    name: "Cursor",
    slug: "cursor",
    aliases: JSON.stringify(["cursor", "cursor ide", "cursor editor"]),
    tagline: "The AI code editor that writes and refactors whole software projects",
    description: "A fork of VS Code with deeply integrated AI agents that understand your full codebase and write entire features in seconds.",
    category: "Coding",
    pricingModel: "Freemium",
    websiteUrl: "https://cursor.com",
  },
  {
    name: "Claude 3.5 Sonnet",
    slug: "claude-3-5",
    aliases: JSON.stringify(["claude", "claude 3.5", "claude 3.5 sonnet", "anthropic claude"]),
    tagline: "Unmatched writing nuance and instant interactive artifact previews",
    description: "Anthropic's flagship model designed for natural, human-sounding copywriting, complex reasoning, and live HTML/React prototypes.",
    category: "Writing & Productivity",
    pricingModel: "Free Tier / $20/mo",
    websiteUrl: "https://claude.ai",
  },
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    aliases: JSON.stringify(["elevenlabs", "eleven labs"]),
    tagline: "Ultra-realistic AI voice cloning and multilingual speech synthesis",
    description: "Generates lifelike human voices in 29+ languages from plain text, ideal for audiobooks, video narrations, and podcasts.",
    category: "Audio & Voice",
    pricingModel: "Free Tier / From $5/mo",
    websiteUrl: "https://elevenlabs.io",
  },
  {
    name: "Make.com",
    slug: "make-com",
    aliases: JSON.stringify(["make", "make.com", "integromat"]),
    tagline: "Visual drag-and-drop workflow automation powered by AI modules",
    description: "Connect 1,500+ apps together without code. Automate customer emails, CRM entries, and content publishing with built-in AI steps.",
    category: "Automation",
    pricingModel: "Free Tier / From $9/mo",
    websiteUrl: "https://make.com",
  },
  {
    name: "Gamma App",
    slug: "gamma-app",
    aliases: JSON.stringify(["gamma", "gamma app"]),
    tagline: "Generate beautiful presentation slides and web docs in 60 seconds",
    description: "Type a prompt or upload an outline, and Gamma creates styled, interactive presentations, document pages, and pitch decks.",
    category: "Presentations",
    pricingModel: "Freemium",
    websiteUrl: "https://gamma.app",
  },
];

