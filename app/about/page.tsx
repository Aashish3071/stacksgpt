import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE_NAME} publishes, who it is for, and our reporting principles.`,
  alternates: { canonical: siteUrl("/about") },
};

export default function AboutPage() {
  return (
    <LegalPage title={`About ${SITE_NAME}`}>
      <p>
        Too much technology journalism is lost in vendor spin, artificial benchmarks,
        and breathless speculation that offers little practical utility.
      </p>
      <p>
        {SITE_NAME} takes the opposite approach. We track developments from the leading research
        laboratories, infrastructure providers, and breakthrough developer platforms.
        For every milestone that matters, we deliver rigorous, high-signal reporting:
        what actually shipped, what the real-world implications are, and an objective assessment
        of whether it delivers genuine leverage.
      </p>
      <p>
        We write for professionals who deploy, integrate, and build with technology: engineers,
        product leaders, founders, and technical operators who need signal over noise.
      </p>
      <p>
        We maintain absolute editorial independence. We do not accept sponsored placements or
        paid links in our editorial coverage. Where a tool profile includes a partner link,
        it is transparently disclosed.
      </p>
    </LegalPage>
  );
}
