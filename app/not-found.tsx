import Link from "next/link";
export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-serif text-3xl">This page isn’t available.</h1>
      <p className="my-5">The story may have moved or may not be published.</p>
      <Link href="/search" className="underline">
        Find another story
      </Link>
    </section>
  );
}
