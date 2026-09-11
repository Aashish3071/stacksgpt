export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-shell animate-pulse px-4 py-10 sm:px-6">
      <div className="border-b border-rule pb-6">
        <div className="h-9 w-48 rounded bg-paper" />
        <div className="mt-3 h-4 w-72 rounded bg-paper" />
      </div>

      <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col space-y-3">
            <div className="aspect-[16/9] w-full rounded border border-rule bg-paper" />
            <div className="h-4 w-20 rounded bg-paper" />
            <div className="h-6 w-full rounded bg-paper" />
            <div className="h-4 w-3/4 rounded bg-paper" />
          </div>
        ))}
      </div>
    </div>
  );
}
