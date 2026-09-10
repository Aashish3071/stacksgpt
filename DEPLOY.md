# Deploying Stacksgpt

The site runs locally on SQLite. Production needs Postgres, because Vercel's
filesystem is ephemeral — a SQLite file there is wiped on every deploy.

## Before you launch — required

2. **Set a real contact address** in `app/contact/page.tsx` (currently a
   `hello@yourdomain.com` placeholder) and review `app/privacy/page.tsx`.

## How content reaches the site

Two independent paths, both landing in the same review queue:

1. **Antigravity agents** commit `.mdx` files to `content/articles/` and their
   images to `public/images/articles/`. On deploy, `npm run build` runs
   `scripts/sync-content.ts`, which validates every file and imports it as a
   **DRAFT**. A malformed file fails the build with the exact reason, so bad
   content never reaches production. The contract the agents follow is in
   [AGENTS.md](AGENTS.md).
2. **The built-in RSS pipeline** (`/api/cron/ingest`, daily) fetches nine
   verified feeds and scores them for relevance, producing a ranked list of
   **story leads** in the admin panel. Hand an interesting URL to your writing
   agent. It drafts articles itself only if `GEMINI_API_KEY` is set.

Neither path can publish. Approving in the admin review queue is the only way an
article goes live, and approval revalidates the affected pages immediately.

To disable the RSS fallback entirely, remove the `crons` block from
`vercel.json`.

## Images

Article images are committed to the repo and served from `/public`, optimised by
Next. `next.config.mjs` allows no remote image patterns, and the validator
rejects any article whose `heroImage` is an external URL — so images cannot
silently break when someone else's host goes away.

At roughly eight images a day this adds ~0.5GB to the repo per year, which is
fine for now. If it becomes a problem, move uploads to Vercel Blob and change
`heroImage` to accept the returned URL, adding that hostname to
`next.config.mjs`.

## 1. Database (Supabase)

The schema is Postgres. Supabase gives you two connection strings and **which
one goes where matters**:

| Variable | Supabase string | Port | Why |
|---|---|---|---|
| `DATABASE_URL` | **Transaction pooler** | 6543 | Every serverless invocation opens its own connection. The direct endpoint's limit is small and will be exhausted under real traffic, producing intermittent `too many connections` errors that look like random 500s. |
| `DIRECT_URL` | **Direct connection** | 5432 | Migrations need a real session; they cannot run through the pooler. |

Copy both from **Supabase → Project Settings → Database → Connection string**.
The pooled one looks like:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

and the direct one like:

```
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

`connection_limit=1` is deliberate: with the pooler in front, each function
instance only needs a single connection of its own.

Create the tables once, from your machine, using the **direct** URL:

```bash
npx prisma db push
```

The app warns at build and at runtime if `DATABASE_URL` is not pooled while
running on Vercel, so a misconfiguration here is visible rather than silent.

## 2. Environment variables in Vercel

Copy from `.env.example`. Generate the secrets fresh — do not reuse the local ones:

```bash
openssl rand -hex 32   # ADMIN_SESSION_SECRET
openssl rand -hex 32   # CRON_SECRET
```

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** string, port 6543 |
| `DIRECT_URL` | Supabase **direct** string, port 5432 |
| `GEMINI_API_KEY` | **Optional.** Only for the built-in writer. Empty = ingestion collects story leads and drafts nothing |
| `GEMINI_MODEL` | Defaults to `gemini-flash-latest`; unused without a key |
| `ADMIN_PASSWORD` | 8+ characters. Admin is disabled if unset |
| `ADMIN_SESSION_SECRET` | Signs the admin cookie |
| `CRON_SECRET` | Required, or `/api/cron/ingest` refuses to run |
| `NEXT_PUBLIC_SITE_URL` | Your domain, no trailing slash. Drives canonicals, sitemap, feed |
| `NEXT_PUBLIC_ADS_PROVIDER` | Leave **empty** until approved. Empty = no ad markup renders |
| `NEXT_PUBLIC_ADSENSE_ID` | Your `pub-…` id, once approved |

## 3. What the build refuses to do

`npm run build` runs `sync-content` then `preflight` before `next build`:

- **Any invalid article** fails the build, whatever state the database is in.
  Content correctness is checked before the database is even contacted.
- **A missing or unreachable `DATABASE_URL`** fails the build. This is
  deliberate: without it the deploy would succeed and quietly replace a working
  site with an empty one, handing search engines a sitemap containing no
  articles. A failed build leaves the previous good deployment serving.
- **Zero published articles** fails the build for the same reason. Override with
  `ALLOW_EMPTY_BUILD=true` when you genuinely intend it, such as a first launch.
- **A database that connects but has no tables** is allowed through once, with a
  warning, because a brand new database must be deployed before `prisma db push`
  can be pointed at it.

## 4. Cron

`vercel.json` schedules `/api/cron/ingest` daily at 06:00 UTC. Vercel sends the
`CRON_SECRET` as a bearer token automatically once the variable is set.

Verify it actually fired by checking the function log the next morning — do not
assume it works. To trigger a run by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/ingest
```

Vercel Hobby caps function duration at 60s. If a run times out, lower the batch:
`/api/cron/ingest?limit=4`.

## 5. Turning ads on

Ads render nowhere while `NEXT_PUBLIC_ADS_PROVIDER` is empty. Applying to
AdSense requires their script to be live on the site, so setting
`NEXT_PUBLIC_ADS_PROVIDER=adsense` plus your publisher id *is* the application
step. Before then you need:

- a real domain (a `vercel.app` subdomain will not be approved)
- a genuine archive of reviewed articles — not the seeded demo content
- `/about`, `/privacy`, `/contact`, `/editorial-standards` live (they are)
- `public/ads.txt` filled in with your publisher id

If you serve readers in the EU or UK you also need a Google-certified consent
banner before ads may set cookies. `components/AdSlot.tsx` is the single place
that hooks into.
