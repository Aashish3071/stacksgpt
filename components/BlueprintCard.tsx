import Link from "next/link";
import Image from "next/image";
import { Lock, Unlock, Clock, BarChart, Wrench } from "lucide-react";
import { blueprintGoalLabel, blueprintDifficultyLabel, blueprintSetupTimeLabel } from "@/lib/site";

export interface BlueprintCardData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  outcome?: string | null;
  goal: string;
  category?: string;
  roles?: string[];
  tools?: string[];
  difficulty: string;
  setupTime: string;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  unlockCount?: number;
}

interface Props {
  blueprint: BlueprintCardData;
  isUnlocked?: boolean;
  variant?: "featured" | "standard" | "compact";
}

export default function BlueprintCard({
  blueprint,
  isUnlocked = false,
  variant = "standard",
}: Props) {
  const href = `/blueprints/${blueprint.slug}`;
  const goalLabel = blueprintGoalLabel(blueprint.goal);
  const difficulty = blueprintDifficultyLabel(blueprint.difficulty);
  const setupTime = blueprintSetupTimeLabel(blueprint.setupTime);

  if (variant === "compact") {
    return (
      <article className="border border-rule bg-paper p-4 transition hover:border-ink/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {goalLabel}
            </span>
            <h3 className="mt-1 font-serif text-base font-bold text-ink hover:text-accent">
              <Link href={href}>{blueprint.title}</Link>
            </h3>
            <p className="mt-1 text-xs text-ink/70 line-clamp-2">
              {blueprint.outcome || blueprint.summary}
            </p>
          </div>
          <div className="shrink-0 text-xs">
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
                <Unlock className="h-3 w-3" />
                Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-rule px-2 py-0.5 text-ink/70">
                <Lock className="h-3 w-3" />
                Free
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group grid grid-cols-1 overflow-hidden border border-rule bg-paper transition hover:border-ink/40 md:grid-cols-12">
        <div className="relative min-h-[220px] md:col-span-6 lg:col-span-7">
          <Link href={href} className="block h-full w-full">
            {blueprint.heroImage ? (
              <Image
                src={blueprint.heroImage}
                alt={blueprint.heroImageAlt || blueprint.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-rule/50 text-ink/40">
                <Wrench className="h-12 w-12" />
              </div>
            )}
          </Link>
          <div className="absolute left-3 top-3">
            <span className="rounded bg-ink/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-paper">
              {goalLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between p-6 md:col-span-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between text-xs text-ink/70">
              <span className="font-mono uppercase">Featured Blueprint</span>
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  <Unlock className="h-3 w-3" /> Unlocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-rule px-2 py-0.5 text-xs text-ink/70">
                  <Lock className="h-3 w-3" /> Free with email
                </span>
              )}
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-ink group-hover:text-accent">
              <Link href={href}>{blueprint.title}</Link>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {blueprint.outcome || blueprint.summary}
            </p>
          </div>

          <div className="mt-6 border-t border-rule pt-4">
            <div className="flex flex-wrap items-center gap-y-2 text-xs text-ink/70">
              <span className="inline-flex items-center gap-1 mr-4">
                <Clock className="h-3.5 w-3.5" />
                {setupTime}
              </span>
              <span className="inline-flex items-center gap-1 mr-4">
                <BarChart className="h-3.5 w-3.5" />
                {difficulty}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard card
  return (
    <article className="group flex flex-col overflow-hidden border border-rule bg-paper transition hover:border-ink/40">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-rule/30">
        <Link href={href} className="block h-full w-full">
          {blueprint.heroImage ? (
            <Image
              src={blueprint.heroImage}
              alt={blueprint.heroImageAlt || blueprint.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/40">
              <Wrench className="h-10 w-10" />
            </div>
          )}
        </Link>
        <div className="absolute left-2.5 top-2.5">
          <span className="rounded bg-ink/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-paper">
            {goalLabel}
          </span>
        </div>
        <div className="absolute right-2.5 top-2.5">
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1 rounded bg-paper/90 px-2 py-0.5 text-[11px] font-medium text-accent shadow-sm">
              <Unlock className="h-3 w-3" /> Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-paper/90 px-2 py-0.5 text-[11px] font-medium text-ink/80 shadow-sm">
              <Lock className="h-3 w-3" /> Free with email
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="font-serif text-lg font-bold leading-snug text-ink group-hover:text-accent">
            <Link href={href}>{blueprint.title}</Link>
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink/75 line-clamp-2">
            {blueprint.outcome || blueprint.summary}
          </p>
        </div>

        <div className="mt-4 border-t border-rule pt-3">
          <div className="flex items-center justify-between text-[11px] text-ink/70">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {setupTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <BarChart className="h-3 w-3" />
              {difficulty}
            </span>
            <span className="font-semibold text-accent">Read guide →</span>
          </div>
        </div>
      </div>
    </article>
  );
}
