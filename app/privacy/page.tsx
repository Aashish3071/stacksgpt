import Link from "next/link";
import { LegalPage } from "@/lib/legal-pages";
export const metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <LegalPage title="Privacy policy">
      <h2>Newsletter</h2>
      <p>
        We store your email address and subscription status to deliver the
        newsletter through our configured email provider. Confirming your
        address is required before newsletter delivery. Each newsletter includes
        an unsubscribe link. Unsubscribing stops delivery; we retain the
        suppression record to avoid emailing you again. Contact us to request
        deletion.
      </p>
      <h2>Optional analytics and advertising</h2>
      <p>
        These features are disabled until configured by the publisher and
        accepted through Privacy choices. You can reject them or change your
        choice using the control at the foot of every page. Your choice is
        stored in this browser.
      </p>
      <p>
        When analytics are enabled and accepted, we record daily counts of
        article views, reading engagement, source clicks, and searches. We do
        not store raw search queries in our editorial analytics. Counts are
        retained for 90 days. Vercel Analytics and Speed Insights, and Google
        Analytics when configured, may process usage and performance information
        under their own policies.
      </p>
      <p>
        When advertising is enabled and accepted, Google AdSense may load
        advertising resources and use cookies. Links to tools and partners may
        lead to third parties with separate policies.
      </p>
      <h2>Security and editorial accounts</h2>
      <p>
        Our hosting and database providers process requests to operate and
        protect the service. Short-lived, hashed network identifiers limit
        abusive requests. Editors use essential sign-in cookies; editorial
        actions and revisions are retained for accountability.
      </p>
      <h2>Contact</h2>
      <p>
        Use our <Link href="/contact">contact page</Link> to ask about your data
        or request deletion. We do not sell newsletter addresses.
      </p>
    </LegalPage>
  );
}
