import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach us about corrections, questions or partnerships.",
  alternates: { canonical: siteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p>
        For corrections, questions, or anything else, email{" "}
        {/* TODO: replace with your real address once the domain is registered. */}
        <strong>hello@yourdomain.com</strong>.
      </p>
      <p>
        If you are reporting an error in an article, please include the headline and what
        specifically is wrong. Corrections are made promptly and noted on the article.
      </p>
      <p>
        We do not accept guest posts, sponsored articles, or paid links in editorial copy.
      </p>
    </LegalPage>
  );
}
