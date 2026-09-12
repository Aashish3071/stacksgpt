# Publishing workflow: Slack → ChatGPT → Antigravity → site → social

Who does what, and which parts are actually automated.

## The intended chain

1. You drop source links (an X post, an article) into Slack.
2. ChatGPT turns those into a brief for Antigravity.
3. Antigravity researches, writes, and commits the article.
4. The site imports it; an editor approves it; it publishes.
5. ChatGPT reads the published article and writes the X and LinkedIn copy.
6. The copy waits in an approval queue; you approve; it posts.

## What is automated, and what is not

Steps 3, 4, 5 and 6 each have a real API behind them. The handoffs **between**
tools do not run themselves:

| Handoff | Reality |
|---|---|
| Slack → ChatGPT | You paste, or use a Slack connector. ChatGPT does not watch a channel on its own. |
| ChatGPT → Antigravity | **Manual.** Two separate products with no link between them. You carry the brief across. |
| Antigravity → site | **Automated.** Antigravity commits MDX, or POSTs to `/api/import/article`. |
| site → publish | **Human gate, by design.** An editor approves in `/admin`. |
| article → ChatGPT | **Automated**, once ChatGPT can call the read API (below). |
| ChatGPT → queue | **Automated**, via `/api/import/social`. |
| queue → X / LinkedIn | **Human gate**, then automated send. |

So this is "each step is one click or one API call" rather than "hands off".
The two human gates are deliberate: nothing reaches the public site or your
social accounts without someone looking at it first.

## Giving ChatGPT direct access (ChatGPT Plus, no API key needed)

Custom GPTs are included with Plus, and their Actions are called by ChatGPT's
own servers — no OpenAI API key or billing is involved.

1. ChatGPT → **Explore GPTs → Create → Configure → Actions → Create new action**
2. Paste `docs/chatgpt-actions-openapi.yaml` into the schema box.
3. **Authentication → API Key**, Auth Type **Bearer**, value = `INGEST_SECRET`
   (the same value set in Vercel).
4. In the GPT's instructions, tell it how you want posts written — audience,
   tone, what to avoid. The site's own editorial rules are in `AGENTS.md`.

It can then call:

- `listArticles?needsSocial=true&platform=X` — what still needs writing
- `getArticle/{slug}` — the full article to write from
- `submitSocialPost` — file the finished copy for approval

## The endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/public/articles` | none | List published articles; `?needsSocial=true&platform=X` filters to ones with no post yet |
| `GET /api/public/articles/{slug}` | none | One article as JSON: title, summary, keyPoints, verdict, body, source, canonical URL |
| `POST /api/import/social` | `INGEST_SECRET` | File written copy against an article; lands in the approval queue |
| `POST /api/import/article` | `INGEST_SECRET` | Antigravity's article import |

The read endpoints are unauthenticated on purpose: they return exactly what
the public article pages and the RSS feed already publish, and JSON is far
more reliable for an agent than scraping rendered HTML.

### Length limits

X is 280 characters, but **every link counts as 23** regardless of its real
length — so a post can be over 280 raw characters and still be valid. The API
does that calculation and rejects anything that genuinely will not fit, with
the real number in the error. LinkedIn is 3000.

### Revising

Submitting again for the same article and platform **replaces** the draft and
returns it to `PENDING_APPROVAL`, even if it had been approved — a rewrite
deserves a fresh read. A post that has already been **sent** is locked: the
record should not claim something different from what is public.

## Approving and posting

`/admin/social-posts` lists everything waiting. Per post you can edit the copy,
then:

- **Approve** — queues it; the next delivery run sends it.
- **Send now** — posts immediately and shows the result.
- **Reject** — drops it.

Delivery runs come from `.github/workflows/scheduled-tasks.yml` every 15
minutes, with the daily Vercel crons as a fallback. (Vercel's Hobby plan
refuses any cron more frequent than daily, which is why the schedule lives in
GitHub Actions.)

## Still required before anything can post

Sending is gated on credentials that do not exist yet. Until they are set,
drafting and approving work fine and the send step fails with a clear
"not configured" error. `/admin/settings` shows the live status of both.

- **X**: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
  from developer.x.com. Posting requires a paid API tier.
- **LinkedIn**: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN` from an app tied
  to the Company Page, with the Community Management API product approved —
  LinkedIn reviews this manually, so start it early.
- **`INGEST_SECRET`** must match between Vercel and the Custom GPT.
