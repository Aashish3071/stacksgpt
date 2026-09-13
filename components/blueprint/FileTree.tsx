import { Folder, FileText } from "lucide-react";

interface Props {
  tree: string;
}

export default function FileTree({ tree }: Props) {
  const lines = tree.trim().split("\n");

  return (
    <div className="my-5 rounded-[2px] border border-rule bg-paper p-4 font-mono text-xs">
      <div className="mb-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-ink/60">
        Project Structure
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => {
          const isDir = line.trim().endsWith("/");
          const parts = line.split("#");
          const pathPart = parts[0];
          const commentPart = parts[1];

          return (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink/90">
                {isDir ? (
                  <Folder className="h-3.5 w-3.5 text-accent shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                )}
                <span>{pathPart}</span>
              </span>
              {commentPart && (
                <span className="text-[11px] font-sans text-ink/50 italic shrink-0">
                  {commentPart.trim()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
