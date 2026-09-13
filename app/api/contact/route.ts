import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const projectType = typeof body.projectType === "string" ? body.projectType.trim() : "";
    const budget = typeof body.budget === "string" ? body.budget.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !email.includes("@") || !message) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    // Save lead as a Subscriber with custom source and log in AuditLog
    try {
      await prisma.subscriber.upsert({
        where: { email },
        create: {
          email,
          source: `agency_contact:${projectType || "general"}`,
        },
        update: {},
      });
    } catch (e) {
      console.warn("Could not upsert contact to Subscriber:", e);
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: "CONTACT_INQUIRY",
          actorId: email,
          detail: {
            name,
            email,
            company,
            projectType,
            budget,
            message,
            submittedAt: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.warn("Could not record contact audit log:", err);
    }

    return NextResponse.json({
      ok: true,
      message: "Your inquiry has been received. Our automation engineers will review your requirements and respond within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { ok: false, error: "Could not submit inquiry. Please try again or email us directly." },
      { status: 500 },
    );
  }
}
