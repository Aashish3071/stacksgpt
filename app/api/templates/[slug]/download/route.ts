import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMemberStatus } from "@/lib/member";
import { getTemplate } from "@/lib/templates";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) {
    return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  }

  const member = await getMemberStatus();
  if (!member.isMember) {
    return NextResponse.json(
      { ok: false, error: "Unlock this template with your email first." },
      { status: 401 },
    );
  }

  // The slug comes from the catalog lookup above, never straight from the URL.
  const file = path.join(process.cwd(), "content", "templates", "workflows", `${template.slug}.json`);
  const body = await readFile(file);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.slug}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
