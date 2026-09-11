"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-serif text-3xl">We couldn’t load this page.</h1>
      <p className="my-5">
        Please try again. If the problem continues, contact the publication.
      </p>
      <button onClick={reset} className="border px-5 py-3">
        Try again
      </button>
    </section>
  );
}
