import fs from "node:fs";
import path from "node:path";

interface TemplateSource {
  slug: string;
  title: string;
  source: string;
}

interface N8nNode {
  type: string;
  name?: string;
  credentials?: Record<string, unknown>;
  webhookId?: string;
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

const ROOT = process.cwd();
const TEMPLATE_DIR = path.join(ROOT, "content", "templates");
const WORKFLOW_DIR = path.join(TEMPLATE_DIR, "workflows");
const SOURCES_FILE = path.join(TEMPLATE_DIR, "sources.json");
const FACTS_FILE = path.join(TEMPLATE_DIR, "facts.json");

// Resource locators under these keys point at the original author's sheets, folders,
// channels or sub-workflows, so they are blanked for the reader to pick their own.
const RESOURCE_KEYS = new Set([
  "documentId", "sheetName", "fileId", "folderId", "driveId", "databaseId", "pageId",
  "blockId", "channelId", "base", "table", "calendar", "workflowId", "teamId",
  "projectId", "boardId", "listId", "spaceId", "workspaceId", "user", "assistantId",
  "pineconeIndex", "qdrantCollection", "organizationId", "tableId",
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const GOOGLE_FILE_RE =
  /(docs\.google\.com\/(?:spreadsheets|document|presentation|forms)\/d\/|drive\.google\.com\/(?:file\/d\/|drive\/(?:u\/\d+\/)?folders\/|open\?id=))[A-Za-z0-9_-]{20,}/g;
const LINKEDIN_PROFILE_RE = /linkedin\.com\/in\/[A-Za-z0-9_%-]+/g;

const SECRET_PATTERNS: [string, RegExp][] = [
  ["openai key", /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ["google key", /AIza[0-9A-Za-z_-]{30,}/],
  ["slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["github token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["apify token", /apify_api_[A-Za-z0-9]{20,}/],
  ["bearer token", /Bearer\s+(?![<{$=]|YOUR|your)[A-Za-z0-9._-]{24,}/],
];

function parseFirstJsonObject(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    // Some exports have a second copy of the workflow appended after the first object.
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) return JSON.parse(raw.slice(0, i + 1));
    }
    throw new Error("No complete JSON object found.");
  }
}

function scrubString(value: string, isStickyNote: boolean): string {
  let out = value.replace(EMAIL_RE, (m) => (/@example\.(com|org)$/i.test(m) ? m : "you@example.com"));
  out = out.replace(LINKEDIN_PROFILE_RE, "linkedin.com/in/example-profile");
  if (!isStickyNote) out = out.replace(GOOGLE_FILE_RE, "$1YOUR_FILE_ID");
  return out;
}

function scrub(value: unknown, isStickyNote: boolean, key?: string): unknown {
  if (Array.isArray(value)) return value.map((v) => scrub(v, isStickyNote));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "cachedResultName" || k === "cachedResultUrl") continue;
      out[k] = scrub(v, isStickyNote, k);
    }
    if (out.__rl === true && key && RESOURCE_KEYS.has(key) && out.mode !== "name") {
      out.value = "";
    }
    return out;
  }
  if (typeof value === "string") return scrubString(value, isStickyNote);
  return value;
}

function shortType(type: string): string {
  return type.slice(type.lastIndexOf(".") + 1);
}

function main() {
  const sources: TemplateSource[] = JSON.parse(fs.readFileSync(SOURCES_FILE, "utf8"));
  fs.mkdirSync(WORKFLOW_DIR, { recursive: true });

  const facts: Record<string, unknown> = {};
  let failures = 0;

  for (const src of sources) {
    const sourcePath = path.join(ROOT, src.source);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Missing source for ${src.slug}: ${src.source}`);
      failures++;
      continue;
    }

    const workflow = parseFirstJsonObject(fs.readFileSync(sourcePath, "utf8"));
    const rawNodes = (workflow.nodes as N8nNode[]) ?? [];

    const credentialTypes = [
      ...new Set(rawNodes.flatMap((n) => Object.keys(n.credentials ?? {}))),
    ].sort();

    const nodes = rawNodes.map((node) => {
      const { credentials: _credentials, webhookId: _webhookId, ...rest } = node;
      return scrub(rest, node.type === "n8n-nodes-base.stickyNote") as N8nNode;
    });

    const sanitized = {
      name: src.title,
      nodes,
      connections: workflow.connections ?? {},
      settings: {
        executionOrder:
          (workflow.settings as Record<string, unknown> | undefined)?.executionOrder ?? "v1",
      },
    };

    const output = JSON.stringify(sanitized, null, 2) + "\n";
    const leaks = SECRET_PATTERNS.filter(([, re]) => re.test(output)).map(([label]) => label);
    if (leaks.length) {
      console.error(`Refusing to write ${src.slug}: possible ${leaks.join(", ")} found.`);
      failures++;
      continue;
    }

    fs.writeFileSync(path.join(WORKFLOW_DIR, `${src.slug}.json`), output);

    const types = nodes.map((n) => shortType(n.type));
    facts[src.slug] = {
      sourceName: typeof workflow.name === "string" ? workflow.name : "",
      nodeCount: nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote").length,
      nodeTypes: [...new Set(types)].sort(),
      triggerTypes: [
        ...new Set(types.filter((t) => /Trigger$/.test(t) || t === "webhook" || t === "cron")),
      ].sort(),
      credentialTypes,
    };
    console.log(`Built ${src.slug}`);
  }

  const ordered = Object.fromEntries(Object.entries(facts).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(FACTS_FILE, JSON.stringify(ordered, null, 2) + "\n");

  if (failures) {
    console.error(`${failures} template(s) failed.`);
    process.exitCode = 1;
  }
}

main();
