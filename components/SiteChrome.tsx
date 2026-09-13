"use client";

import { usePathname } from "next/navigation";

export default function SiteChrome({
  navbar,
  children,
  footer,
}: {
  navbar: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1 min-h-screen bg-surface">{children}</main>;
  }

  return (
    <>
      {navbar}
      <main className="flex-1 w-full m-0 p-0">{children}</main>
      {footer}
    </>
  );
}
