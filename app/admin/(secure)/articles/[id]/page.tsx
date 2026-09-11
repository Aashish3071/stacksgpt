import { editor } from "@/lib/editor-auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import NewsroomEditor from "@/components/NewsroomEditor";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await editor();
  } catch {
    redirect("/admin/login");
  }
  const [record, profiles, taxonomy, media, revisions] = await Promise.all([
    prisma.article.findUnique({ where: { id: (await params).id } }),
    prisma.profile.findMany({
      where: { active: true },
      select: { id: true, displayName: true },
    }),
    prisma.taxonomy.findMany({ where: { active: true } }),
    prisma.mediaAsset.findMany({ take: 100, orderBy: { createdAt: "desc" } }),
    prisma.articleRevision.findMany({
      where: { articleId: (await params).id },
      take: 30,
      orderBy: { version: "desc" },
    }),
  ]);
  if (!record) notFound();
  return (
    <NewsroomEditor
      {...JSON.parse(
        JSON.stringify({ record, profiles, taxonomy, media, revisions }),
      )}
    />
  );
}
