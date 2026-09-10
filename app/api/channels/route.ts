import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { newsItems: true },
        },
      },
    });
    return NextResponse.json({ channels });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, handleOrUrl, type = "TWITTER", category = "General" } = body;

    if (!name || !handleOrUrl) {
      return NextResponse.json({ error: "Name and Handle/URL are required." }, { status: 400 });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        handleOrUrl,
        type,
        category,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, channel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing channel id" }, { status: 400 });

    await prisma.channel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
