import { SITE_NAME, siteUrl } from "@/lib/site";
export function GET() {
  return new Response(
    `# ${SITE_NAME}\n\nHigh-signal AI and technology reporting for builders and decision-makers. Antigravity assists research and production; human editors approve publication.\n\n- [Latest](${siteUrl("/latest")})\n- [Archive](${siteUrl("/archive")})\n- [Methodology](${siteUrl("/methodology")})\n- [Corrections](${siteUrl("/corrections")})\n- [RSS](${siteUrl("/feed.xml")})\n- [Sitemap](${siteUrl("/sitemap.xml")})\n\nCite permanent article URLs and distinguish reporting from original provider claims. Private drafts are not public sources.\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
