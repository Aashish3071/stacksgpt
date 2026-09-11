import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { siteUrl } from "./site";
export async function imageDetails(bytes: Uint8Array) {
  const meta = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
  if (
    !["png", "jpeg", "webp", "avif", "heif"].includes(meta.format || "") ||
    !meta.width ||
    !meta.height
  )
    throw Error("Unsupported or invalid image.");
  if (meta.width < 1200 || meta.height < 630 || meta.width <= meta.height)
    throw Error("Use a landscape hero image of at least 1200 × 630 pixels.");
  if ((meta.pages || 1) > 1) throw Error("Use a still image.");
  return meta;
}
export async function verifyHeroImage(
  url: string,
  { localRequired = false } = {},
) {
  let bytes: Uint8Array;
  if (/^\/images\/articles\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|avif)$/.test(url)) {
    try {
      bytes = await readFile(path.join(process.cwd(), "public", url));
      return await details(bytes);
    } catch (e) {
      if (
        !process.env.VERCEL ||
        localRequired ||
        (e as NodeJS.ErrnoException).code !== "ENOENT"
      )
        throw e instanceof Error
          ? e
          : Error("The selected hero image is missing or invalid.");
    }
    url = siteUrl(url);
  }
  {
    const base = process.env.SUPABASE_URL;
    if (
      ((!base ||
        !url.startsWith(`${base}/storage/v1/object/public/article-media/`)) &&
        !url.startsWith(siteUrl("/images/articles/"))) ||
      /[?#]/.test(url)
    )
      throw Error("Choose an image from the media library.");
    const r = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok || !r.body) throw Error("The uploaded image is unavailable.");
    const reader = r.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 5000000) {
        await reader.cancel();
        throw Error("Hero image exceeds 5 MB.");
      }
      parts.push(value);
    }
    bytes = Buffer.concat(parts);
  }
  if (bytes.length > 5000000) throw Error("Hero image exceeds 5 MB.");
  return details(bytes);
}
async function details(bytes: Uint8Array) {
  if (bytes.length > 5000000) throw Error("Hero image exceeds 5 MB.");
  const meta = await imageDetails(bytes);
  return {
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    width: meta.width!,
    height: meta.height!,
    byteSize: bytes.length,
  };
}
