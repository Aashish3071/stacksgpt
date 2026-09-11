import { notFound } from "next/navigation";
import { LegalPage } from "@/lib/legal-pages";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { action } = await params;
  const { token } = await searchParams;
  if (
    !["confirm", "unsubscribe"].includes(action) ||
    !token ||
    !/^[0-9a-f-]{36}$/.test(token)
  )
    notFound();
  return (
    <LegalPage
      title={action === "confirm" ? "Confirm your subscription" : "Unsubscribe"}
    >
      <p>
        {action === "confirm"
          ? "Confirm that you would like to receive the Stacksgpt newsletter."
          : "Stop receiving the Stacksgpt newsletter. You can subscribe again whenever you wish."}
      </p>
      <form method="POST" action={`/api/newsletter/${action}?token=${token}`}>
        <button className="bg-ink text-paper px-5 py-3">
          {action === "confirm" ? "Confirm subscription" : "Unsubscribe"}
        </button>
      </form>
    </LegalPage>
  );
}
