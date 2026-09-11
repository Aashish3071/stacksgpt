import Link from "next/link";
import { LegalPage } from "@/lib/legal-pages";
export const metadata = { title: "Terms of use" };
export default function Page() {
  return (
    <LegalPage title="Terms of use">
      <p>
        Stacksgpt publishes general information about AI and technology.
        Availability, prices, and product features can change after an article
        is published. Check the linked provider for current details before
        relying on an offer or making a purchase.
      </p>
      <h2>Using our work</h2>
      <p>
        You may link to our articles and share short attributed excerpts.
        Contact us about republication or other reuse. Third-party names,
        images, and quotations remain subject to their owners’ rights.
      </p>
      <h2>External services</h2>
      <p>
        Source and partner links lead to services operated by others. Their
        terms and privacy policies apply when you visit them. A link is not a
        promise about that service.
      </p>
      <h2>Responsible use</h2>
      <p>
        Do not attempt to access private editorial records, bypass security
        controls, overload the site, or submit unlawful material.
      </p>
      <p>
        Questions about these terms can be sent through our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
