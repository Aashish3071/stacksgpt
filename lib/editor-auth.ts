import { perRequest } from "./per-request-cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import prisma from "./db";

export const AUTH_COOKIE = "stacksgpt_session";

function getMasterSecret(): string {
  if (
    process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.trim().length >= 16
  ) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    return crypto
      .createHmac("sha256", dbUrl)
      .update("stacksgpt_editorial_session_secret")
      .digest("hex");
  }
  throw Error("Neither ADMIN_SESSION_SECRET nor DATABASE_URL is configured.");
}

export type EditorRole = "ADMIN" | "EDITOR";

// The role travels inside the signed payload, so a session cannot be edited
// to grant itself a higher role. Previously every master session was treated
// as ADMIN, which silently promoted anyone who signed in through the direct
// database path.
export function createMasterSession(
  email = "admin@stacksgpt.com",
  role: EditorRole = "ADMIN",
): string {
  const secret = getMasterSecret();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = `master:${email}:${role}:${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const claims = Buffer.from(`${email}:${role}`).toString("base64url");
  return `master.${expiresAt}.${hmac}.${claims}`;
}

export function verifyMasterSession(
  token: string,
): { email: string; role: EditorRole } | null {
  try {
    const secret = getMasterSecret();
    if (!token.startsWith("master.")) return null;
    const parts = token.split(".");
    if (parts.length !== 4) return null;
    const [, expStr, hmac, claimsB64] = parts;
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return null;
    const claims = Buffer.from(claimsB64, "base64url").toString("utf8");
    const split = claims.lastIndexOf(":");
    if (split < 1) return null;
    const email = claims.slice(0, split);
    const role = claims.slice(split + 1);
    if (role !== "ADMIN" && role !== "EDITOR") return null;
    const payload = `master:${email}:${role}:${expStr}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    if (
      hmac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
    )
      return null;
    return { email, role: role as EditorRole };
  } catch {
    return null;
  }
}

export function supabase(token?: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw Error("Supabase authentication is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
  });
}

// Deduped per request: the admin layout and the admin page both authenticate
// independently. For Supabase-issued sessions each call is an HTTP round trip
// to Supabase plus a Profile lookup, so this halves the auth cost per page.
export const editor = perRequest(async function editor() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw Error("Unauthorized");

  const master = verifyMasterSession(token);
  if (master) {
    return {
      id: "master-admin",
      email: master.email,
      displayName:
        master.role === "ADMIN" ? "Editorial Admin" : "Editorial Editor",
      role: master.role,
      active: true,
      token,
    };
  }

  const { data, error } = await supabase().auth.getUser(token);
  if (error || !data.user) throw Error("Unauthorized");
  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile?.active || !["ADMIN", "EDITOR"].includes(profile.role))
    throw Error("Editorial access required.");
  return { ...profile, token };
});

export async function admin() {
  const p = await editor();
  if (p.role !== "ADMIN") throw Error("Administrator access required.");
  return p;
}

export async function requireEditor() {
  try {
    return await editor();
  } catch {
    redirect("/admin/login");
  }
}

export async function requireAdmin() {
  try {
    const p = await editor();
    if (p.role !== "ADMIN") {
      redirect("/admin");
    }
    return p;
  } catch {
    redirect("/admin/login");
  }
}
