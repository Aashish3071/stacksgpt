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

## 1. Database (Vercel + Neon Storage)

Stacksgpt uses Prisma with PostgreSQL for production.

### Option A: Via Vercel Dashboard (Recommended)
1. In your Vercel project, navigate to the **Storage** tab.
2. Select **Neon** (or Vercel Postgres powered by Neon) and click **Create / Connect**.
3. Vercel automatically creates the database and populates environment variables:
   - `DATABASE_URL`: Set to the pooled connection string (e.g. `postgres://...@...pooler...neon.tech/neondb?sslmode=require`).
   - `DIRECT_URL`: Set to the direct, unpooled connection string (e.g. `postgres://...@...neon.tech/neondb?sslmode=require`).
   *(Note: If Vercel provides `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`, simply add `DATABASE_URL` = `$POSTGRES_PRISMA_URL` and `DIRECT_URL` = `$POSTGRES_URL_NON_POOLING` in your Vercel Environment Variables).*

### Option B: Via Neon.tech Directly
1. Create a database at [https://neon.tech](https://neon.tech).
2. Under Connection Details, copy both:
   - **Pooled connection string** $\rightarrow$ `DATABASE_URL`
   - **Unpooled / Direct connection string** $\rightarrow$ `DIRECT_URL`
3. Add both to your Vercel Project Settings $\rightarrow$ Environment Variables.

### Initialize Database Tables & Seed
Once your Neon database is connected, initialize the tables and seed the starting channels and tool registry:

```bash
# Push schema tables to Neon
npx prisma db push

# Seed default channels and tool registry
npm run seed

# Sync articles from content/articles into Neon
npm run sync:content
```

## 2. Environment variables in Vercel

Copy from `.env.example`. Generate the secrets fresh — do not reuse the local ones:

```bash
openssl rand -hex 32   # ADMIN_SESSION_SECRET
openssl rand -hex 32   # CRON_SECRET
```

| Variable | Notes |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | From Neon |
| `GEMINI_API_KEY` | **Optional.** Only for the built-in writer. Empty = ingestion collects story leads and drafts nothing |
| `GEMINI_MODEL` | Defaults to `gemini-flash-latest`; unused without a key |
| `ADMIN_PASSWORD` | 8+ characters. Admin is disabled if unset |
| `ADMIN_SESSION_SECRET` | Signs the admin cookie |
| `CRON_SECRET` | Required, or `/api/cron/ingest` refuses to run |
| `NEXT_PUBLIC_SITE_URL` | Your domain, no trailing slash. Drives canonicals, sitemap, feed |
| `NEXT_PUBLIC_ADS_PROVIDER` | Leave **empty** until approved. Empty = no ad markup renders |
| `NEXT_PUBLIC_ADSENSE_ID` | Your `pub-…` id, once approved |

## 3. Cron

`vercel.json` schedules `/api/cron/ingest` daily at 06:00 UTC. Vercel sends the
`CRON_SECRET` as a bearer token automatically once the variable is set.

Verify it actually fired by checking the function log the next morning — do not
assume it works. To trigger a run by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/ingest
```

Vercel Hobby caps function duration at 60s. If a run times out, lower the batch:
`/api/cron/ingest?limit=4`.

## 4. Turning ads on

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
