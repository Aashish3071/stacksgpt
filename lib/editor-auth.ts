import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import prisma from "./db";
export const AUTH_COOKIE = "stacksgpt_session";
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
