import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.MEMBER_COOKIE_SECRET || "local-dev-secret-stacksgpt-blueprints";

export function signMemberId(id: string): string {
  const signature = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
  return `${id}.${signature}`;
}

export function verifyMemberToken(token: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [id, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
  try {
    const isMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    return isMatch ? id : null;
  } catch {
    return null;
  }
}

export async function getMemberStatus(): Promise<{ isMember: boolean; memberId?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sgpt_member")?.value;
    if (!token) return { isMember: false };
    const memberId = verifyMemberToken(token);
    if (!memberId) return { isMember: false };
    return { isMember: true, memberId };
  } catch (err) {
    console.error("Error evaluating member status:", err);
    return { isMember: false };
  }
}
