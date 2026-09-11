# Stacksgpt

High-signal AI and technology reporting. Antigravity researches the original provider announcements or the X/Twitter links supplied by the owner, writes reported articles, and generates relevant illustrations. RSS supplies fallback leads only when no source has been provided.

## Working publication

The site includes public full-text search, latest and archive pages, categories, tags, source and audience pages, pagination, source attribution, correction notes, structured metadata, RSS, and a paginated sitemap.

The authenticated newsroom supports individual Supabase accounts, admin and editor roles, private previews, a full article editor, revision history, audit records, review, approval, rejection and scheduling. Live copy is preserved while a revised draft is reviewed. Changing an approved draft invalidates its approval. Publication checks require a source, non-future timestamps, an author, an available image with credit and alt text, article content and SEO fields. Committed images cannot be overwritten without breaking the build; revisions use a new image filename.

Administrators manage feed health and fallback discovery, taxonomy, media details, real partner/disclosure records, site settings, newsletter campaigns, and engagement reporting. Newsletter signup requires confirmation, and every send includes unsubscribe support. Sending requires a configured SMTP provider. Ads and analytics require both site configuration and reader consent.

## Local setup

1. Use Node 22.9 or newer and run `npm ci`.
2. Copy `.env.example` to `.env.local` and supply the server settings.
3. Run `npm run db:migrate` against the intended Supabase database.
4. Create the owner’s Supabase Auth account and run `npm run admin:bootstrap -- EMAIL "DISPLAY NAME"`.
5. Run `npm run dev` and open `/admin/login`.

See [DEPLOY.md](DEPLOY.md) for Vercel, database pooling, scheduling and sender setup. See [AGENTS.md](AGENTS.md) for the writing contract and [ANTIGRAVITY_PROMPT.md](ANTIGRAVITY_PROMPT.md) for editorial orchestration. The API handoff is documented in [docs/antigravity-integration.md](docs/antigravity-integration.md).

## Checks

- `npm run sync:content -- --dry`: validates article files and images without writing.
- `npm run sync:content`: imports changed files into the private review queue.
- `npm run typecheck` and `npm run lint`: application checks.
- `npm run test:integration`: temporary-schema migration and publishing/security tests.
- `npm run build`: validation, review-queue import, database/image preflight, and production compilation.

The application does not create editorial facts, commercial agreements, or account credentials. SMTP delivery, scheduled execution, and production advertising remain disabled until their real service settings are supplied. No draft is published by a deployment or external agent.
