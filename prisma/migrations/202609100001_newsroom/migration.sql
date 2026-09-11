-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastSuccessAt" TIMESTAMP(3),
ADD COLUMN     "pollingEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RawNews" ADD COLUMN     "duplicateOf" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "noveltyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "usefulnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "additionalSources" JSONB,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "audiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "correctionNote" TEXT,
ADD COLUMN     "editorsPick" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heroImageOrigin" TEXT NOT NULL DEFAULT 'generated',
ADD COLUMN     "pendingDraft" JSONB,
ADD COLUMN     "pendingHash" TEXT,
ADD COLUMN     "pendingStatus" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "structuredVerdict" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRedirect" (
    "slug" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleRedirect_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "articleId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportAttempt" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxonomy" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "credit" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "disclosure" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLink" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartnerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDaily" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "articleId" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterDelivery" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleRevision_articleId_version_key" ON "ArticleRevision"("articleId", "version");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_kind_slug_key" ON "Taxonomy"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_url_key" ON "MediaAsset"("url");

-- CreateIndex
CREATE UNIQUE INDEX "EventDaily_day_event_articleId_key" ON "EventDaily"("day", "event", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterDelivery_newsletterId_subscriberId_key" ON "NewsletterDelivery"("newsletterId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber"("token");

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRedirect" ADD CONSTRAINT "ArticleRedirect_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLink" ADD CONSTRAINT "PartnerLink_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Profile" ADD CONSTRAINT "Profile_role_check" CHECK (role IN ('ADMIN','EDITOR'));
CREATE INDEX "Article_published_date_idx" ON "Article" ("publishedAt" DESC) WHERE "isPublished";
CREATE INDEX "Article_schedule_idx" ON "Article" ("scheduledFor") WHERE "scheduledFor" IS NOT NULL;
CREATE INDEX "Article_tags_idx" ON "Article" USING gin(tags);
CREATE INDEX "Article_audiences_idx" ON "Article" USING gin(audiences);
ALTER TABLE "Article" ADD COLUMN "searchDocument" tsvector;
CREATE FUNCTION stacksgpt_search_refresh() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."searchDocument" := setweight(to_tsvector('english',coalesce(NEW.title,'')),'A') || setweight(to_tsvector('english',coalesce(NEW.summary,'')),'B') || to_tsvector('english',coalesce(NEW.body,'')||' '||coalesce(NEW."jargonBuster",'')||' '||coalesce(NEW.category,'')||' '||coalesce(NEW."sourceAuthor",'')||' '||coalesce(array_to_string(NEW.tags,' '),'')); RETURN NEW; END $$;
CREATE TRIGGER stacksgpt_search_update BEFORE INSERT OR UPDATE ON "Article" FOR EACH ROW EXECUTE FUNCTION stacksgpt_search_refresh();
UPDATE "Article" SET "searchDocument"=to_tsvector('english',coalesce(title,'')||' '||coalesce(summary,'')||' '||coalesce(body,''));
CREATE INDEX "Article_search_idx" ON "Article" USING gin("searchDocument");

ALTER TABLE "Article" ADD COLUMN "publishedUpdatedAt" TIMESTAMP(3);
UPDATE "Article" SET "publishedUpdatedAt"="publishedAt" WHERE "isPublished"=true;

ALTER TABLE "MediaAsset" ADD COLUMN "contentHash" TEXT, ADD COLUMN "width" INTEGER, ADD COLUMN "height" INTEGER, ADD COLUMN "byteSize" INTEGER;
