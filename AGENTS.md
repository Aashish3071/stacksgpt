# Writing articles for StacksGPT

This repository powers a news site that delivers high-signal AI and tech reporting
for builders, leaders, and operators: clever, persuasive, and stripped of vendor hype.
Agents contribute by committing article files. Nothing else in the repo should be modified to publish an article.

## What to do

1. Write one article as an `.mdx` file in `content/articles/`.
2. Commit its hero image to `public/images/articles/`.
3. Commit and push. The deploy imports the file into the review queue, where a
   human approves it. **Committing does not publish** — that is deliberate.

## Filename

`content/articles/YYYY-MM-DD-short-slug.mdx` — for example
`2026-09-10-openai-realtime-voice-api.mdx`.

The filename is the article's permanent id. Re-committing the same filename
updates that article; a new filename creates a new one. Never rename a file to
"fix" an article — edit it in place.

## Story types — read this first

This is a **news site**. Every article is reported journalism and uses the same
structure. There is no tutorial format here: no copy-paste prompt templates, no
step-by-step walkthroughs, no jargon glossaries. Even a use case is *reported*,
meaning you describe what someone did and what came of it, rather than
instructing the reader.

The `type` field says what kind of story it is. It changes the label shown on the
page, not the shape of the article.

| `type` | For |
|---|---|
| `ANNOUNCEMENT` | A lab or company ships a model or product |
| `NEWS` | General tech news, e.g. an Apple launch or an acquisition |
| `UPDATE` | A change to an existing tool or model |
| `TOOL` | A profile of a tool such as Hermes or Ollama |
| `USE_CASE` | Reporting on a real-world use case in industry |
| `SHOWCASE` | Reporting on someone demonstrating an AI capability |

Every article, whatever its type, needs all five of these:

| Field | What it is |
|---|---|
| **Headline** (`title`) | What happened and why it matters: sharp, clever, and high-signal |
| **Summary** (`summary`) | 1-2 paragraphs of persuasive, high-signal standfirst |
| **What's New** (`keyPoints`) | 2-6 concise bullets of concrete facts |
| **Why It Matters** (`verdict`) | 1-3 sentences: the honest takeaway for builders and buyers |
| **Body prose** | 200+ words of reported context, background, pricing and caveats |

## House style

**No em dashes.** Use a comma, a full stop or a colon. This is enforced at build
time across the headline, summary, key points, verdict and body.

Write with intellectual clarity and persuasive authority. Do not patronize readers
or write as if they know nothing. Communicate sharp technical leverage, real capabilities,
and commercial realities.

## The file

YAML frontmatter carries the structured content the site renders. For reported
stories the markdown body below it is the article itself.

```mdx
---
type: "ANNOUNCEMENT"
title: "What OpenAI's new voice API actually lets you do"
slug: "openai-realtime-voice-api"
category: "Productivity"
summary: >
  A concise, persuasive paragraph, 40 characters minimum, explaining why this
  development matters to builders and teams. This is the standfirst under the headline.
sourceName: "OpenAI"
sourceUrl: "https://openai.com/index/introducing-the-realtime-api/"
toolName: "ChatGPT"

# When the SOURCE published (from the page itself), and when you fetched it.
# Both required. Never invent either — a wrong date on a news article is a
# factual error, and the build rejects unparseable or future dates.
publishedDate: "2026-09-10"
retrievedAt: "2026-09-10T14:32:00Z"

heroImage: "/images/articles/2026-09-10-openai-realtime-voice-api.png"
heroImageAlt: "A phone showing a live voice conversation with an assistant"
heroImageCredit: "Illustration generated for StacksGPT"

keyPoints:
  - "The assistant now replies fast enough to interrupt, like a phone call."
  - "Available today on paid plans; no date given for the free tier."
  - "Voice data is processed on OpenAI's servers, not on your device."



verdict: >
  Honest, specific advice on whether this is worth paying for, or whether the
  free tier is enough. 30 characters minimum.
---

Optional markdown prose. Use it for context or analysis that does not fit the
structured sections above. Most articles do not need it.
```

## Required fields

| Field | Rule |
|---|---|
| `type` | One of ANNOUNCEMENT, NEWS, UPDATE, TOOL, USE_CASE, SHOWCASE. See the table above. |
| `title` | 15+ characters. For reported news, say what happened and why it matters. For practical pieces, say what the reader can do. |
| `summary` | 40+ characters. Persuasive and high-signal, zero fluff. |
| `category` | Exactly one of: Productivity, Writing, Coding, Research, Design, Automation. |
| `sourceName` | Who published the original, e.g. "Anthropic", "Mistral". |
| `sourceUrl` | Link to the original announcement. **Every article must have one.** |
| `keyPoints` | 2–6 scannable bullets. Required on every article. |
| body prose | 200+ words of reported context. Required on every article. |
| `verdict` | Required on every article: 1–3 sentences of "Why It Matters". |
| `publishedDate` | Date the original source published, `YYYY-MM-DD`. Cannot be in the future. |
| `retrievedAt` | UTC timestamp when you fetched the source, ISO 8601. |
| `heroImageAlt` | Required whenever `heroImage` is set. |

## SEO fields

Search is the only traffic source that compounds, and traffic is the whole
revenue model. These are derived automatically if you omit them, but writing
them deliberately is better — a derived title is a truncated headline, which is
rarely the best thing to show in a results page.

| Field | Rule |
|---|---|
| `slug` | Lowercase words separated by single hyphens, under 70 characters. Yours is respected as written; omit it and one is generated from the headline. |
| `seoTitle` | **60 characters max** — Google truncates past that. Front-load the keyword. May differ from the on-page headline. |
| `metaDescription` | **110–160 characters.** Under 110 wastes the snippet; over 160 is cut off. Write it as ad copy: say what the reader gets. |
| `keywords` | 3–8 lowercase terms. Note Google ignores the keywords meta tag — these are for internal grouping and other engines, so do not keyword-stuff. |

Over-length `seoTitle`, over-length `metaDescription` and malformed slugs are
**build errors**. Short descriptions and thin keyword lists are warnings.

A file missing any of these is rejected and the build fails with the reason.
Fix the file rather than removing the field.

## Rules that are not negotiable

- **Attribute everything.** Link the original. Summarise and explain in your own
  words; never reproduce more than a short quoted phrase from the source.
- **Never invent facts.** Only state what the source states. If it gives no
  price, availability date, or benchmark, say so — do not guess. No invented
  version numbers, quotes or statistics.
- **Never invent commercial offers.** No discount codes, referral links,
  affiliate URLs or partnership claims. Ever. Partner links are added by hand by
  the site owner, through the admin panel, and only after a real agreement.
- **No fabricated authority.** No star ratings, "Editor's Choice" badges,
  reader counts, or claims that the team tested something it did not test.
- **Write with clever, persuasive authority.** Respect the reader's intellect.
  Explain technical leverage, commercial implications, and practical trade-offs
  without buzzwords or dumbed-down generalities.

## Images

- Commit the file to `public/images/articles/`, named to match the article file.
- Reference it as `/images/articles/<name>.png`: a path from `public`, not a
  filesystem path and not an external URL.
- Landscape, at least 1200×630, under about 300KB. It is served self-hosted and
  optimised by Next.
- `heroImageAlt` describes the image for screen readers and search engines.
  Describe what is shown, not the article topic.

## Sources worth watching

Model providers publish their own announcements: Anthropic, OpenAI, Qwen,
Mistral, DeepSeek, Ollama, Nous Research (Hermes) and similar. Prefer a
provider's own post over secondhand coverage, and always link to the provider.

## Checking your work before committing

```bash
npm run sync:content -- --dry
```

Validates every file and reports each problem without writing anything.
