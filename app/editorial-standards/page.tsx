import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial standards",
  description:
    "How our articles are researched, reported, fact-checked and corrected.",
  alternates: { canonical: siteUrl("/editorial-standards") },
};

export default function EditorialStandardsPage() {
  return (
    <LegalPage title="Editorial standards">
      <p>
        <strong>How articles are made.</strong> We monitor official laboratory
        releases, developer feeds, and primary technology announcements. Every
        story is thoroughly researched, edited, and fact-checked before
        publication.
      </p>
      <p>
        <strong>AI assistance.</strong> We use AI research agents to gather
        sources, prepare first drafts, and produce illustrations. Nothing
        reaches the site automatically. Every draft enters a private queue where
        a human editor checks the source links, dates, and factual claims,
        edits the wording, and approves it before it is published; later changes
        require approval again. Generated illustrations are labelled as such
        wherever they appear. Our{" "}
        <Link href="/methodology">methodology page</Link> describes this process
        in full.
      </p>
      <p>
        <strong>Attribution.</strong> Every article names the source it is based
        on and links to the original announcement. We summarise and explain in
        our own words rather than reproducing someone else&rsquo;s reporting,
        and we quote only briefly where a quote is necessary.
      </p>
      <p>
        <strong>Accuracy.</strong> We only state what the source states. Where a
        detail such as price or availability is not given, we say so plainly
        rather than speculating. If something is wrong or outdated, we want to
        know.
      </p>
      <p>
        <strong>Commercial links.</strong> {SITE_NAME} is funded by advertising.
        We do not accept payment for coverage, for a favourable verdict, or for
        placement in our tools directory. On the rare occasion a link is a paid
        partner link, it is labelled as one at the point where it appears. We do
        not invent discount codes or offers.
      </p>
      <p>
        <strong>Corrections.</strong> If we get something wrong, tell us on the{" "}
        <Link href="/contact">contact page</Link> and we will correct the
        article and note the change.
      </p>
    </LegalPage>
  );
}
