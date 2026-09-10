# Writing articles for Stacksgpt

This repository powers a news site that explains AI and tech developments to
non-technical readers in plain English. Agents contribute by committing article files. Nothing
else in the repo should be modified to publish an article.

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

This is a **news site**, not a DIY how-to site. Every piece is written as reported news:
what happened, what the model or tool is actually like, who it affects, what it costs,
and what the catch is.

| `type` | For | Body prose | `keyPoints` (What's New) | `verdict` (Why It Matters) |
|---|---|---|---|---|
| `ANNOUNCEMENT` | A lab or company ships a model or major product | **Required** | **Required** (2–6 pointers) | **Required** |
| `NEWS` | General tech news: Apple launches Apple 18 Pro, policy changes | **Required** | **Required** (2–6 pointers) | **Required** |
| `UPDATE` | A change to a tool or model that already exists | **Required** | **Required** (2–6 pointers) | **Required** |
| `TOOL` | A profile of a tool — what Hermes or Ollama is, who it suits | **Required** | **Required** (2–6 pointers) | **Required** |
| `USE_CASE` | Reporting on a real-world use-case of AI in business | **Required** | **Required** (2–6 pointers) | **Required** |
| `SHOWCASE` | Someone on X/Twitter demonstrating a breakthrough use of AI | **Required** | **Required** (2–6 pointers) | **Required** |

All articles are **reported journalism**.
- `keyPoints`: 2–6 scannable bullet pointers answering **What's New**.
- `verdict`: Plain-English explanation answering **Why It Matters**.
- `body`: The news story itself (200+ characters of prose).
- **Do not include DIY tutorial steps or copy-paste prompt blocks.** Stacksgpt is a news publication, not a prompt directory.
`TOOL` it renders as "Is it worth it?"; it is required on `USE_CASE` and
`SHOWCASE`, where it renders as "The verdict".

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
  A plain-English paragraph, 40 characters minimum, explaining why a normal
  person should care. This is the standfirst under the headline.
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
heroImageCredit: "Illustration generated for Stacksgpt"

keyPoints:
  - "The assistant now replies fast enough to interrupt, like a phone call."
  - "Available today on paid plans; no date given for the free tier."
  - "Voice data is processed on OpenAI's servers, not on your device."

jargonBuster:
  - technicalTerm: "sub-300ms end-to-end latency"
    plainEnglish: "It replies fast enough to feel like a phone call rather than a walkie-talkie."
  - technicalTerm: "speech-to-speech model"
    plainEnglish: "It hears you directly instead of converting your words to text first, so tone survives."

useCases:
  - title: "Run a practice job interview on your commute"
    targetAudience: "Job seekers"
    stepByStep:
      - "Open the voice mode and describe the role you are interviewing for."
      - "Ask it to interview you as the hiring manager, one question at a time."
      - "At the end, ask for the two weakest answers and how to improve them."
    promptTemplate: |
      You are the hiring manager for a [ROLE] position.
      Interview me one question at a time, waiting for my answer before the next.
      After six questions, tell me my two weakest answers and how to improve them.
  - title: "..."
    targetAudience: "..."
    stepByStep: ["..."]

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
| `summary` | 40+ characters. Plain English, no jargon. |
| `category` | Exactly one of: Productivity, Writing, Coding, Research, Design, Automation. |
| `sourceName` | Who published the original, e.g. "Anthropic", "Mistral". |
| `sourceUrl` | Link to the original announcement. **Every article must have one.** |
| `keyPoints` | 2–6 scannable bullets. Required on ANNOUNCEMENT, NEWS, UPDATE and TOOL. |
| `useCases` | Required on USE_CASE and SHOWCASE only. Each needs `title`, `targetAudience`, `stepByStep`. |
| body prose | 300+ characters, required on ANNOUNCEMENT, NEWS, UPDATE and TOOL. |
| `verdict` | 30+ characters when present. Required on USE_CASE and SHOWCASE. |
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
- **Write for someone who does not work in AI.** A small business owner, a
  student, someone in operations. If a sentence needs a glossary, rewrite it.

## Images

- Commit the file to `public/images/articles/`, named to match the article file.
- Reference it as `/images/articles/<name>.png` — a path from `public`, not a
  filesystem path and not an external URL.
- Landscape, at least 1200×630, under about 300KB. It is served self-hosted and
  optimised by Next.
- `heroImageAlt` describes the image for screen readers and search engines.
  Describe what is shown, not the article topic.

## Sources worth watching

Model providers publish their own announcements — Anthropic, OpenAI, Qwen,
Mistral, DeepSeek, Ollama, Nous Research (Hermes) and similar. Prefer a
provider's own post over secondhand coverage, and always link to the provider.

## Checking your work before committing

```bash
npm run sync:content -- --dry
```

Validates every file and reports each problem without writing anything.
