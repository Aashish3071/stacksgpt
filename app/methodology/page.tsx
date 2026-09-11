import Link from "next/link";
import { LegalPage } from "@/lib/legal-pages";
export const metadata = { title: "How we report" };
export default function Page() {
  return (
    <LegalPage title="How we report">
      <p>
        Stacksgpt explains AI announcements in plain English. We start with the
        original announcement, documentation, or a clearly attributed
        demonstration.
      </p>
      <h2>Sources and dates</h2>
      <p>
        Each story links its primary source and distinguishes the source
        publication date from our publication date. Additional reporting belongs
        in the source list. A company claim is attributed to the company; it is
        not presented as an independent test.
      </p>
      <h2>AI assistance and human review</h2>
      <p>
        External research agents can gather sources, prepare drafts, and create
        illustrations. Their submissions enter a private queue. An editor
        reviews the source links, dates, factual claims, wording, image and
        credit before approval. Later changes require approval again.
      </p>
      <h2>Illustrations</h2>
      <p>
        Generated images are labelled as illustrations. They should not be
        mistaken for product screenshots, real photographs, or evidence of an
        event. Provider and licensed media require a credit.
      </p>
      <h2>Useful reporting</h2>
      <p>
        We explain what changed, who is affected, availability, price when
        stated, and limitations. When a source does not provide a detail, we say
        so. We do not invent benchmarks, offers, or testing claims.
      </p>
      <p>
        <Link href="/corrections">Read our corrections policy</Link> and{" "}
        <Link href="/partners">partner disclosures</Link>.
      </p>
    </LegalPage>
  );
}
