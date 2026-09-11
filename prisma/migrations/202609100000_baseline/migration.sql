-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handleOrUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawNews" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "title" TEXT,
    "rawText" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "contentHash" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawNews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolAffiliate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "pricingModel" TEXT NOT NULL DEFAULT 'Freemium',
    "websiteUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NONE',
    "aliases" TEXT,
    "discountCode" TEXT,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolAffiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "summary" TEXT NOT NULL,
    "jargonBuster" TEXT NOT NULL,
    "useCases" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Productivity',
    "primaryToolId" TEXT,
    "readingMinutes" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "sourceAuthor" TEXT,
    "sourceUrl" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'RSS',
    "externalId" TEXT,
    "sourceHash" TEXT,
    "body" TEXT,
    "type" TEXT NOT NULL DEFAULT 'NEWS',
    "keyPoints" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "heroImage" TEXT,
    "heroImageAlt" TEXT,
    "heroImageCredit" TEXT,
    "rawNewsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'homepage',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_handleOrUrl_key" ON "Channel"("handleOrUrl");

-- CreateIndex
CREATE UNIQUE INDEX "RawNews_externalUrl_key" ON "RawNews"("externalUrl");

-- CreateIndex
CREATE INDEX "RawNews_contentHash_idx" ON "RawNews"("contentHash");

-- CreateIndex
CREATE INDEX "RawNews_status_score_idx" ON "RawNews"("status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ToolAffiliate_name_key" ON "ToolAffiliate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ToolAffiliate_slug_key" ON "ToolAffiliate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_externalId_key" ON "Article"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_rawNewsId_key" ON "Article"("rawNewsId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_category_isPublished_idx" ON "Article"("category", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- AddForeignKey
ALTER TABLE "RawNews" ADD CONSTRAINT "RawNews_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_primaryToolId_fkey" FOREIGN KEY ("primaryToolId") REFERENCES "ToolAffiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_rawNewsId_fkey" FOREIGN KEY ("rawNewsId") REFERENCES "RawNews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

