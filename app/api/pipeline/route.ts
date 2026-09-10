import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { transformRawUpdateToArticle } from "@/lib/ai-writer";
import { matchAffiliateTool } from "@/lib/affiliate-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalArticles = await prisma.article.count();
    const totalChannels = await prisma.channel.count();
    const totalTools = await prisma.toolAffiliate.count();
    const totalSubscribers = await prisma.subscriber.count();

    return NextResponse.json({
      status: "online",
      metrics: {
        totalArticles,
        totalChannels,
        totalTools,
        totalSubscribers,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawText, sourceUrl, sourceAuthor, channelHandle, autoPublish = false } = body;

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { error: "rawText must contain at least 10 characters of news or tweet content." },
        { status: 400 }
      );
    }

    // 1. Channel association
    let channel = null;
    if (channelHandle) {
      channel = await prisma.channel.findFirst({
        where: { handleOrUrl: channelHandle },
      });
      if (!channel) {
        channel = await prisma.channel.create({
          data: {
            name: channelHandle,
            handleOrUrl: channelHandle,
            type: channelHandle.includes("twitter.com") || channelHandle.startsWith("@") ? "TWITTER" : "RSS",
            category: "General",
          },
        });
      }
    }

    // 2. Synthesize with AI Writer (Tone Translator + Jargon Buster)
    const decoded = await transformRawUpdateToArticle(
      rawText,
      sourceUrl || "https://twitter.com",
      sourceAuthor || channelHandle || "AI Channel"
    );

    // 3. Look up the tool in the registry. Never creates one: a tool we have
    //    not entered by hand simply gets no tool block on the article.
    const affiliateTool = await matchAffiliateTool(decoded.toolName, decoded.toolCategory);

    // 4. Generate URL slug
    const cleanSlug = decoded.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    const finalSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

    // 5. Store in database
    const article = await prisma.article.create({
      data: {
        title: decoded.title,
        slug: finalSlug,
        originalTitle: rawText.slice(0, 100) + (rawText.length > 100 ? "..." : ""),
        summary: decoded.summary,
        category: decoded.toolCategory || "Productivity",
        keyPoints: JSON.stringify(decoded.keyPoints || []),
        body: decoded.body || "",
        jargonBuster: JSON.stringify(decoded.jargonTranslations || []),
        useCases: JSON.stringify(decoded.useCases || []),
        verdict: decoded.verdict,
        primaryToolId: affiliateTool?.toolId ?? null,
        sourceAuthor: sourceAuthor || channelHandle || "AI Channel",
        sourceUrl: sourceUrl || null,
        status: autoPublish ? "PUBLISHED" : "DRAFT",
        isPublished: autoPublish,
        publishedAt: autoPublish ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        isPublished: article.isPublished,
      },
    });
  } catch (error: any) {
    console.error("Pipeline run error:", error);
    return NextResponse.json({ error: error.message || "Failed to process article" }, { status: 500 });
  }
}
