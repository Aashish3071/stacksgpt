import prisma from "@/lib/db";
import { LegalPage } from "@/lib/legal-pages";
export const metadata = { title: "Partners and disclosures" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    include: { links: { where: { active: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <LegalPage title="Partners and disclosures">
      <p>
        Commercial relationships are recorded separately from editorial
        articles. Paid or commission-bearing links are labelled and do not grant
        a partner approval over reporting.
      </p>
      {partners.length ? (
        partners.map((p) => (
          <section key={p.id}>
            <h2>{p.name}</h2>
            <p>{p.disclosure}</p>
            <ul>
              {p.links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`/api/partners/${l.id}`}
                    rel="sponsored nofollow noopener"
                  >
                    {l.label}
                  </a>{" "}
                  — partner link
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p>There are no active partner relationships listed.</p>
      )}
    </LegalPage>
  );
}
