import fs from "fs";
import path from "path";
import crypto from "crypto";
import yaml from "yaml";
import {
  BLUEPRINT_GOALS,
  BLUEPRINT_CATEGORIES,
  BLUEPRINT_ROLES,
  BLUEPRINT_DIFFICULTIES,
  BLUEPRINT_SETUP_TIMES,
} from "./site";

export const BLUEPRINT_CONTENT_DIR = path.join(
  process.cwd(),
  "content",
  "blueprints",
);
export const BLUEPRINT_IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "blueprints",
);

export interface BlueprintReference {
  title: string;
  url: string;
}

export interface ParsedBlueprint {
  externalId: string;
  slug: string;
  title: string;
  summary: string;
  outcome: string;
  goal: string;
  category: string;
  roles: string[];
  tools: string[];
  difficulty: string;
  setupTime: string;
  costNotes?: string;
  heroImage?: string;
  heroImageAlt?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords: string[];
  references: BlueprintReference[];
  freeBody: string;
  gatedBody: string;
  sourceHash: string;
}

export interface BlueprintParseFailure {
  file: string;
  errors: string[];
}

export type BlueprintParseResult =
  | { ok: true; blueprint: ParsedBlueprint }
  | { ok: false; failure: BlueprintParseFailure };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function listBlueprintFiles(): string[] {
  if (!fs.existsSync(BLUEPRINT_CONTENT_DIR)) return [];
  return fs
    .readdirSync(BLUEPRINT_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => path.join(BLUEPRINT_CONTENT_DIR, f))
    .sort();
}

export function parseBlueprintFile(
  filePath: string,
  options = { checkLocalFiles: true },
): BlueprintParseResult {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return parseBlueprintText(raw, fileName, options);
}

const REQUIRED_H2_PATTERNS = [
  { name: "What You're Building", regex: /^##\s+What\s+You['’]re\s+Building/i },
  { name: "What <Tool> Can Handle", regex: /^##\s+What\s+.+\s+Can\s+Handle/i },
  { name: "What You Need", regex: /^##\s+What\s+You\s+Need/i },
  { name: "The Build Blueprint", regex: /^##\s+The\s+Build\s+Blueprint/i },
  { name: "How to Set It Up", regex: /^##\s+How\s+to\s+Set\s+It\s+Up/i },
  { name: "The Core Workflows", regex: /^##\s+The\s+Core\s+Workflows/i },
  { name: "What Stays Under Your Control", regex: /^##\s+What\s+Stays\s+Under\s+Your\s+Control/i },
  { name: "Templates", regex: /^##\s+Templates/i },
  { name: "Starter Prompt", regex: /^##\s+(?:Copy-Paste\s+)?(?:Starter\s+)?Prompt/i },
  { name: "Customize It", regex: /^##\s+Customize\s+It/i },
  { name: "Keep It Reliable", regex: /^##\s+Keep\s+It\s+Reliable/i },
];

export function parseBlueprintText(
  raw: string,
  fileName: string,
  options = { checkLocalFiles: true },
): BlueprintParseResult {
  const errors: string[] = [];

  // Check em dash rule
  if (raw.includes("—") || raw.includes("–")) {
    errors.push("Em dashes are forbidden by the editorial style guide. Use commas, colons, or full stops.");
  }

  let data: Record<string, unknown>;
  let content: string;
  try {
    const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!match) throw new Error("Missing frontmatter");
    data = (yaml.parse(match[1]) ?? {}) as Record<string, unknown>;
    content = raw.slice(match[0].length);
  } catch {
    return {
      ok: false,
      failure: { file: fileName, errors: ["Invalid YAML frontmatter."] },
    };
  }

  const title = asString(data.title);
  if (!title || title.length < 15) {
    errors.push("`title` must be at least 15 characters.");
  }

  const slug = asString(data.slug);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 70) {
    errors.push("`slug` must be lowercase words separated by single hyphens, under 70 characters.");
  }

  const summary = asString(data.summary);
  if (!summary || summary.length < 40) {
    errors.push("`summary` must be at least 40 characters.");
  }

  const outcome = asString(data.outcome);
  if (!outcome || outcome.length < 20) {
    errors.push("`outcome` must be at least 20 characters (concrete summary of what the reader builds).");
  }

  const goal = asString(data.goal) || "automate-operations";
  const validGoal = BLUEPRINT_GOALS.some((g) => g.slug === goal);
  if (!validGoal) {
    errors.push(`\`goal\` must be one of: ${BLUEPRINT_GOALS.map((g) => g.slug).join(", ")}`);
  }

  const rawCategory = asString(data.category);
  const matchedCategory = BLUEPRINT_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === rawCategory.toLowerCase() || c.label.toLowerCase() === rawCategory.toLowerCase()
  );
  const category = matchedCategory ? matchedCategory.label : "Automation";

  const rawRoles = Array.isArray(data.roles) ? data.roles.map(asString) : [];
  const validRoles = BLUEPRINT_ROLES.map((r) => r.slug);
  const roles = rawRoles.filter((r) => validRoles.includes(r as any));
  if (roles.length === 0) {
    errors.push(`\`roles\` must contain at least one valid role from: ${validRoles.join(", ")}`);
  }

  const tools = Array.isArray(data.tools)
    ? data.tools.map(asString).filter(Boolean)
    : [];
  if (tools.length === 0) {
    errors.push("`tools` must list at least one tool slug.");
  }

  const difficulty = asString(data.difficulty);
  const validDifficulty = BLUEPRINT_DIFFICULTIES.some((d) => d.slug === difficulty);
  if (!validDifficulty) {
    errors.push(`\`difficulty\` must be one of: ${BLUEPRINT_DIFFICULTIES.map((d) => d.slug).join(", ")}`);
  }

  const setupTime = asString(data.setupTime);
  const validSetupTime = BLUEPRINT_SETUP_TIMES.some((s) => s.slug === setupTime);
  if (!validSetupTime) {
    errors.push(`\`setupTime\` must be one of: ${BLUEPRINT_SETUP_TIMES.map((s) => s.slug).join(", ")}`);
  }

  const heroImage = asString(data.heroImage);
  const heroImageAlt = asString(data.heroImageAlt);
  if (heroImage) {
    if (!heroImage.startsWith("/images/blueprints/")) {
      errors.push("`heroImage` must start with /images/blueprints/");
    } else if (options.checkLocalFiles) {
      const onDisk = path.join(process.cwd(), "public", heroImage.replace(/^\//, ""));
      if (!fs.existsSync(onDisk)) {
        errors.push(`\`heroImage\` points at "${heroImage}" but no such file exists on disk.`);
      }
    }
    if (!heroImageAlt || heroImageAlt.length < 5) {
      errors.push("`heroImageAlt` is required when heroImage is provided and must be at least 5 characters.");
    }
  }

  const seoTitle = asString(data.seoTitle);
  if (seoTitle && seoTitle.length > 60) {
    errors.push("`seoTitle` must be 60 characters or fewer.");
  }

  const metaDescription = asString(data.metaDescription);
  if (metaDescription && (metaDescription.length < 110 || metaDescription.length > 160)) {
    errors.push("`metaDescription` should be between 110 and 160 characters for optimal search snippets.");
  }

  const rawKeywords = Array.isArray(data.keywords) ? data.keywords.map(asString) : [];
  const keywords = rawKeywords.filter(Boolean);

  const rawRefs = Array.isArray(data.references) ? data.references : [];
  const references: BlueprintReference[] = [];
  for (const ref of rawRefs) {
    const rTitle = asString(ref?.title);
    const rUrl = asString(ref?.url);
    if (!rTitle || !rUrl) {
      errors.push("Every reference must have a `title` and a `url`.");
    } else if (!rUrl.startsWith("https://")) {
      errors.push(`Reference URL "${rUrl}" must be a secure HTTPS URL.`);
    } else {
      references.push({ title: rTitle, url: rUrl });
    }
  }

  // Gate boundary check
  const gateMatches = content.match(/<!--\s*gate\s*-->/g);
  if (!gateMatches || gateMatches.length !== 1) {
    errors.push("The body must contain exactly one `<!-- gate -->` separator.");
  }

  const parts = content.split(/<!--\s*gate\s*-->/);
  const freeBody = (parts[0] || "").trim();
  const gatedBody = (parts[1] || "").trim();

  // Section order validation
  const foundH2s: string[] = [];
  const h2Lines = content.match(/^##\s+.+$/gm) || [];
  for (const h2 of h2Lines) {
    foundH2s.push(h2.trim());
  }

  let patternIndex = 0;
  for (const required of REQUIRED_H2_PATTERNS) {
    const matchIndex = foundH2s.findIndex((h2, idx) => idx >= patternIndex && required.regex.test(h2));
    if (matchIndex === -1) {
      errors.push(`Missing or out of order H2 section: "## ${required.name}"`);
    } else {
      patternIndex = matchIndex + 1;
    }
  }

  if (errors.length > 0) {
    return { ok: false, failure: { file: fileName, errors } };
  }

  const externalId = fileName.replace(/\.mdx?$/, "");
  const sourceHash = crypto.createHash("sha256").update(raw).digest("hex");

  return {
    ok: true,
    blueprint: {
      externalId,
      slug,
      title,
      summary,
      outcome,
      goal,
      category,
      roles,
      tools,
      difficulty,
      setupTime,
      costNotes: asString(data.costNotes) || undefined,
      heroImage: heroImage || undefined,
      heroImageAlt: heroImageAlt || undefined,
      seoTitle: seoTitle || undefined,
      metaDescription: metaDescription || undefined,
      keywords,
      references,
      freeBody,
      gatedBody,
      sourceHash,
    },
  };
}
