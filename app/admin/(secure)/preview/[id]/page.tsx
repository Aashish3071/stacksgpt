import { editor } from "@/lib/editor-auth";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import ArticleReader from "@/components/ArticleReader";
import { safeMarkdown } from "@/lib/safe-markdown";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private editorial preview",
  robots: { index: false, follow: false },
};
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
  const record = await prisma.article.findUnique({
    where: { id: (await params).id },
    include: { primaryTool: true },
  });
  if (!record) notFound();
  const article = { ...record, ...((record.pendingDraft as any) || {}) };
  return (
    <>
      <div className="bg-amber-50 border-b p-4 text-center text-sm">
        Private preview · {record.pendingStatus || record.status} · This draft
        is not publicly available.
      </div>
      <ArticleReader
        article={{
          ...article,
          bodyHtml: await safeMarkdown(article.body || ""),
        }}
      />
    </>
  );
}
