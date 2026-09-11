import prisma from "@/lib/db";
import { publicUrl } from "@/lib/security";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const link = await prisma.partnerLink.findUnique({
    where: { id: (await params).id },
    include: { partner: true },
  });
  if (
    !link?.active ||
    !link.partner.active ||
    !link.partner.disclosure ||
    !publicUrl(link.url)
  )
    return new Response("Partner link not found.", { status: 404 });
  return Response.redirect(link.url, 307);
}
