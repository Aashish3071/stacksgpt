import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal-pages";
import { SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data this site collects and how it is used.",
  alternates: { canonical: siteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        {/* TODO: review before launch, and add your ad network's specific disclosures
            plus a consent banner if you serve readers in the EU or UK. */}
        This policy explains what {SITE_NAME} collects and why.
      </p>
      <p>
        <strong>Newsletter.</strong> If you subscribe, we store your email address for the sole
        purpose of sending the newsletter. We do not sell or share it. Every email includes an
        unsubscribe link, and unsubscribing deletes your address.
      </p>
      <p>
        <strong>Analytics.</strong> We count how many times each article is viewed. This is a simple
        counter and is not tied to you or your device.
      </p>
      <p>
        <strong>Advertising.</strong> This site is funded by advertising. Ad providers may set
        cookies or use similar technologies to measure and select the ads you see. If you are in a
        region that requires consent for this, you will be asked before any such cookies are set,
        and you can change your choice at any time.
      </p>
      <p>
        <strong>Links to other sites.</strong> Articles link to the sources they are based on and to
        the tools they describe. Those sites have their own privacy policies, which we do not
        control.
      </p>
      <p>
        <strong>Your rights and questions.</strong> To ask what we hold about you, or to have it
        deleted, use the <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
