import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE_NAME} publishes, who it is for, and how it is made.`,
  alternates: { canonical: siteUrl("/about") },
};

export default function AboutPage() {
  return (
    <LegalPage title={`About ${SITE_NAME}`}>
      <p>
        Most AI coverage is written for people who already work in AI. It reports which model beat
        which benchmark, and leaves you to work out whether any of it changes your Tuesday.
      </p>
      <p>
        {SITE_NAME} does the opposite. We follow the announcements from major labs, tech launches,
        and new AI tools, and for each one that matters we publish a concise news piece in plain English:
        what was announced, what is new, why it matters to normal users, and an honest verdict on
        whether it is worth paying for or whether free options are enough.
      </p>
      <p>
        It is written for people who use these tools rather than build them — someone running a
        small business, doing the marketing, managing operations, studying, or freelancing.
      </p>
      <p>
        We are independent and not affiliated with any AI company. Where we link to a tool as a
        paid partner, that link is labelled on the page where it appears.
      </p>
    </LegalPage>
  );
}
