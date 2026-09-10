# Stacksgpt

**AI & tech news in plain English.**

## What we are building

A daily news site that covers AI and tech announcements, new model releases,
tool updates, and real-world use cases — explained so non-technical people can
actually understand what they are like.

Almost all tech and AI coverage is written for engineers and industry insiders.
It reports benchmark tables and leaves everyday professionals to work out what
it actually means. Stacksgpt is a news publication (not a DIY tutorial blog)
built around plain English clarity.

Every article delivers:

| Section | What it does |
|---|---|
| **Headline** | Plain-English headline stating what happened or what the model is like |
| **Summary** | One standfirst paragraph explaining why an everyday person should care |
| **What's New** | Scannable bullet pointers summarizing what shipped or changed |
| **Why It Matters** | Clear pointers explaining the real-world significance |
| **Reported Prose** | News journalism covering capabilities, who it affects, and pricing |
| **The Verdict** | Honest advice, including when free tools are enough |

That format is the product. The news itself is a commodity; the translation is
not.

**How it makes money:** display advertising. Revenue is pageviews × RPM, and
pageviews are something we control through article volume, search visibility and
page speed. Affiliate links are not part of the model — a partner link appears
only if a real agreement exists, entered by hand, and labelled where it appears.

## How it works

```
  Sources                    Writing                  Review              Live
  ─────────                  ───────                  ──────              ────
  Provider blogs        →   Antigravity agents   →   MDX committed   →   Human      →  Published
  (Anthropic, OpenAI,       (research → write →       to the repo,        approves
   Qwen, Mistral,            image → QA)              imported as         in /admin
   DeepSeek, Ollama…)                                 a DRAFT
                                                          ↑
  RSS feeds (9 sources) →   scored story leads  ────────┘
                            in /admin
```

Two things are deliberate:

**Nothing publishes itself.** Both paths land in a review queue. A person
approves every article before it goes live. This is what keeps the site on the
right side of Google's scaled-content policy, and it is the difference between
an archive that reads as a publication and one that reads as scraped output.

**Nothing is invented.** The pipeline cannot generate an affiliate link, a
discount code, a rating or a badge. Articles are rejected at build time if they
lack a source URL, real timestamps, or a specifically relevant image.

## Repository map

| Path | Purpose |
|---|---|
| `content/articles/` | Articles as MDX. **This is where writing agents work.** |
| `public/images/articles/` | Article images, self-hosted |
| `AGENTS.md` | The file-format contract agents must follow |
| `ANTIGRAVITY_PROMPT.md` | The orchestration prompt for the writing agents |
| `DEPLOY.md` | Vercel + Neon setup and pre-launch checklist |
| `lib/content.ts` | Validates agent-written articles; the gate before the database |
| `scripts/sync-content.ts` | Imports MDX into the review queue at build time |
| `lib/sources/` | RSS adapters (`x.ts` is a deliberate stub — X has no free read tier) |
| `lib/relevance.ts` | Scores story leads so the queue stays useful |
| `lib/ad-config.ts` | Every ad placement and its reserved dimensions |
| `app/admin/` | Review queue, story leads, sources, tools |

## Running it

```bash
npm install
npx prisma db push
npm run dev
```

`/admin` needs `ADMIN_PASSWORD` set in `.env` (8+ characters).

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run sync:content -- --dry` | Validate articles without writing |
| `npm run sync:content` | Import articles into the review queue |
| `npm run build` | Validate + import + build |
| `npm run seed` | Seed sources and the tools directory |

## Current state

Working: the editorial design, the MDX pipeline with validation, the review
queue, admin auth, RSS lead collection across nine verified feeds, ad slots
(rendering nothing until a network is configured), sitemap, feed, structured
data, and the policy pages.

Not done yet: the Postgres switch for production (see `DEPLOY.md`), a registered
domain, and AdSense approval — which needs a real archive of reviewed articles
before it is worth applying.
