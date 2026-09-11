# Stacksgpt deployment

Stacksgpt uses Next.js on Vercel and Supabase Postgres, Auth, and Storage. Antigravity supplies researched drafts and relevant images. The app does not contain an AI writer.

## Server configuration

Use Node 22 or newer. Put actual credentials in ignored `.env.local` for local work and Vercel Environment Variables for deployment. `.env.example` contains placeholders. Do not prefix database, authentication, import, scheduler, or SMTP credentials with `NEXT_PUBLIC_`.

Set `DATABASE_URL` to the Supabase transaction pooler connection from the project’s Connect panel. Set `DIRECT_URL` to its direct connection, or its session pooler when direct IPv6 is unavailable. Both contain a private password. The app uses the PostgreSQL driver with certificate verification and a pool of at most three connections per warm process. The public Supabase root certificate is bundled in `certs/`.

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the canonical `NEXT_PUBLIC_SITE_URL`. Although Supabase’s publishable key is designed for public clients, this application keeps it on the server as requested. Generate separate random values of at least 32 characters for `INGEST_SECRET`, `CRON_SECRET`, and `RATE_LIMIT_SECRET`.

## Migrate and create the first administrator

Run `npm ci`, then `npm run db:migrate`. The runner uses a transaction and an advisory lock. It checks the original table columns before baselining an existing installation, applies the additive migration, records migration checksums, enables RLS, creates the image bucket and seeds the default category taxonomy. It never approves or publishes articles. Do not use `prisma db push`; full-text indexes and access policies are maintained by the checked-in SQL.

Create the real owner’s account in Supabase Authentication. Use an invitation or an account created with a password, according to your account setup. Then run:

```sh
npm run admin:bootstrap -- owner@example.com "Owner Name"
```

This promotes only an existing matching Auth identity and refuses when an administrator already exists. Sign in at `/admin/login`. Additional users must first exist in Supabase Auth, then receive a role in Editorial accounts. Editors can work on drafts, review, approve, preview, and schedule articles. Administrators also manage accounts, feeds, taxonomy, partners, settings and newsletters.

## Content and approvals

Antigravity commits one permanent MDX filename and its illustration, or submits MDX to `POST /api/import/article` with `Authorization: Bearer INGEST_SECRET` and JSON containing `externalId` and `mdx`. API images must already exist at a committed site image path or in the Supabase `article-media` bucket. Human editors can upload images from the article editor.

Every import goes into a private draft. The editor assigns its author and checks the content, dates, sources, image, and metadata. The normal sequence is Draft → In review → Approved → Published or Scheduled. Every saved change invalidates the prior approval. Changes to a published story remain in a separate pending draft until published again.

Images must be landscape, at least 1200 × 630 pixels, and under 5 MB; about 300 KB is recommended. Committed image URLs are immutable after registration. To change an image, use a new versioned filename. Builds check images referenced by published stories and fail on deletion or replacement. Uploaded images use unique paths with no overwrite or deletion policy.

`npm run sync:content -- --dry` validates without writing. `npm run build` imports changed files, checks the database and live images, then builds Next.js. It refuses empty publications unless `ALLOW_EMPTY_BUILD=true` is explicitly set. A fresh installation can use that flag to launch its private newsroom before the first article is approved.

## Scheduling

`vercel.json` retains the daily RSS fallback schedule. In Settings, the owner can turn fallback discovery off. Every feed must also have its exact hostname in `RSS_ALLOWED_HOSTS`. A run fetches at most three feeds, starting with the least recently checked. Health and editorial lead decisions are visible in the newsroom.

For timely scheduled publication and newsletter batches, a scheduler must call `GET /api/cron/publish` every minute with `Authorization: Bearer CRON_SECRET`. Each run publishes up to five due approved revisions and sends a small newsletter batch. It never approves drafts. Choose a frequency supported by your hosting plan; the daily fallback configuration alone does not provide minute-level publication.

An optional Supabase Edge Function relay is included at `supabase/functions/maintenance`. Deploy it using the Supabase CLI and set its server secrets `PUBLICATION_URL`, `PUBLICATION_CRON_SECRET` and an independent `MAINTENANCE_SECRET`. Invoke it by POST with the maintenance bearer secret from a scheduler. `verify_jwt=false` applies only to this relay, which enforces its own secret. Do not put these secrets in public SQL or browser code. The relay is provided but is not automatically deployed by the application migration.

## Email, ads and privacy

Enter your provider’s SMTP credentials through server environment settings and set an authenticated `NEWSLETTER_FROM`. Configure SPF/DKIM through the provider. Signup remains unavailable until sending is configured. Subscribers must confirm their address before inclusion. Campaigns are drafted and deliberately queued by an administrator. Every newsletter includes unsubscribe links and one-click unsubscribe headers. Failed or uncertain deliveries are not automatically retried to avoid duplicates; investigate provider logs first.

Enter the real contact address, social links, analytics choice, and ad configuration in Settings. Ads and analytics default off. AdSense needs a real publisher ID and a slot ID for each desired placement. Optional resources wait for a reader’s consent, and Privacy choices can revoke it. Complete the ad network’s account and regional consent requirements before enabling ads; the built-in preference control is not a Google-certified CMP. Populate `public/ads.txt` with the actual authorized seller record from your provider.

## Checks

`npm run typecheck`, `npm run lint`, `npm run test:integration`, and `npm run build` cover types, lint, publication controls, and production compilation. Integration tests create a uniquely named test schema and remove only that schema afterward. They never change public articles. CI runs them against a separate PostgreSQL service. Also verify sign-in, a private preview, and an actual test delivery using your configured identity and email provider before launch.
