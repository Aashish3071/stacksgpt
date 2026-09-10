import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},
      create: {
        email: email.toLowerCase().trim(),
        source: source || "website",
      },
    });

    return NextResponse.json({ success: true, email: subscriber.email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to subscribe" }, { status: 500 });
  }
}
