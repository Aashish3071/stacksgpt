import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import prisma from "./db";
export function safeEqual(a: string, b: string) {
  const hash = (x: string) => createHash("sha256").update(x).digest();
  return timingSafeEqual(hash(a), hash(b));
}
export function publicUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !isIP(u.hostname) &&
      /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(u.hostname) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const reqHost = (
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      new URL(req.url).host
    ).toLowerCase();

    // Only the exact host actually serving the request may pass (this also
    // covers local dev, since both origin and host are "localhost:PORT").
    // Do NOT widen this to "*.vercel.app" or a hardcoded domain: vercel.app
    // is a shared suffix across every Vercel project (anyone's deployment
    // would pass), and this check is the site's CSRF defense on every
    // mutating admin/API request.
    if (originHost === reqHost) return;
  } catch {}

  throw Error("This request must originate from the publication.");
}
export function requireSecret(req: Request, key: string) {
  const secret = process.env[key];
  if (
    !secret ||
    secret.length < 32 ||
    !safeEqual(req.headers.get("authorization") || "", `Bearer ${secret}`)
  )
    throw Error("Unauthorized service request.");
}
export async function limitedJson(req: Request, max = 500000) {
  const reader = req.body?.getReader();
  if (!reader) throw Error("Request body is required.");
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw Error("Request exceeds the size limit.");
    }
    parts.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch {
    throw Error("Invalid JSON.");
  }
}
export async function rateLimit(req: Request, kind: string, limit = 30) {
  const ip = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for") || "shared"
    : "local";
  const key = createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SECRET || "stacksgpt"}:${kind}:${ip}`)
    .digest("hex");
  const now = new Date();
  const rows = await prisma.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${new Date(now.getTime() + 60000)}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count"+1 END,"expiresAt"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${new Date(now.getTime() + 60000)} ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
  if (rows[0].count > limit)
    throw Error("Too many requests. Please try again in a minute.");
}
export async function validateFeedUrl(value: string) {
  if (!publicUrl(value)) throw Error("Use a public HTTPS feed URL.");
  const host = new URL(value).hostname;
  const allowed = (process.env.RSS_ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.includes(host))
    throw Error(
      `Add ${host} to the server RSS_ALLOWED_HOSTS allowlist before fetching.`,
    );
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw Error("Feed resolves to a non-public address.");
  return value;
}
export function isPublicAddress(ip: string) {
  if (ip.includes(":")) return !/^(::|fc|fd|fe[89ab]|ff|2001:db8)/i.test(ip);
  const n = ip.split(".").map(Number);
  return !(
    n[0] === 0 ||
    n[0] === 10 ||
    n[0] === 127 ||
    n[0] >= 224 ||
    (n[0] === 169 && n[1] === 254) ||
    (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
    (n[0] === 192 && (n[1] === 168 || n[1] === 0)) ||
    (n[0] === 100 && n[1] >= 64 && n[1] <= 127) ||
    (n[0] === 198 && [18, 19, 51].includes(n[1])) ||
    (n[0] === 203 && n[1] === 0)
  );
}
