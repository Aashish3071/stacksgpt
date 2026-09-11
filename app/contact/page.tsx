import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach us about corrections, questions or partnerships.",
  alternates: { canonical: siteUrl("/contact") },
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <LegalPage title="Contact">
      <p>
        {settings.contactEmail ? (
          <>
            For corrections or questions, email{" "}
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
            .
          </>
        ) : (
          <>
            Our contact address will be listed here when the publication
            launches.
          </>
        )}
      </p>
      <p>
        If you are reporting an error in an article, please include the headline
        and what specifically is wrong. Corrections are made promptly and noted
        on the article.
      </p>
      <p>
        We do not accept guest posts, sponsored articles, or paid links in
        editorial copy.
      </p>
    </LegalPage>
  );
}
