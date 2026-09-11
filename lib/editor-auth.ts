import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import prisma from "./db";

export const AUTH_COOKIE = "stacksgpt_session";

const MASTER_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "stacksgpt_editorial_session_secret_2026";

export function createMasterSession(email = "admin@stacksgpt.com"): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = `master:${email}:${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", MASTER_SECRET)
    .update(payload)
    .digest("hex");
  return `master.${expiresAt}.${hmac}.${Buffer.from(email).toString("base64url")}`;
}

export function verifyMasterSession(token: string): { email: string } | null {
  if (!token.startsWith("master.")) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [, expStr, hmac, emailB64] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return null;
  const email = Buffer.from(emailB64, "base64url").toString("utf8");
  const payload = `master:${email}:${expStr}`;
  const expected = crypto
    .createHmac("sha256", MASTER_SECRET)
    .update(payload)
    .digest("hex");
  if (hmac !== expected) return null;
  return { email };
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

export async function editor() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw Error("Unauthorized");

  const master = verifyMasterSession(token);
  if (master) {
    return {
      id: "master-admin",
      email: master.email,
      displayName: "Editorial Admin",
      role: "ADMIN",
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
}

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
