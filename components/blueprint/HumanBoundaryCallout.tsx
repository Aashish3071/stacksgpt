import { ShieldCheck } from "lucide-react";
import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function HumanBoundaryCallout({ children }: Props) {
  return (
    <div className="my-6 rounded-[2px] border-l-4 border-l-accent border border-rule bg-accent/5 p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
        <ShieldCheck className="h-4 w-4" />
        <span>What Stays Under Your Control</span>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-ink/90 prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}
