import factsJson from "../content/templates/facts.json";
import { TEMPLATE_ENTRIES } from "../content/templates/catalog";

export const TEMPLATE_CATEGORIES = [
  {
    slug: "sales-and-leads",
    label: "Sales & Leads",
    description: "Qualify, research and follow up with prospects.",
  },
  {
    slug: "customer-support",
    label: "Customer Support",
    description: "Triage, route and answer customer issues.",
  },
  {
    slug: "email-and-admin",
    label: "Email & Admin",
    description: "Sort, draft and act on the email that lands in your inbox.",
  },
  {
    slug: "marketing-and-content",
    label: "Marketing & Content",
    description: "Research, create and publish content in your own voice.",
  },
  {
    slug: "research-and-analysis",
    label: "Research & Analysis",
    description: "Monitor competitors, feedback, news and performance.",
  },
  {
    slug: "documents-and-finance",
    label: "Documents & Finance",
    description: "Pull clean data out of invoices, statements and files.",
  },
  {
    slug: "hr-and-recruiting",
    label: "HR & Recruiting",
    description: "Screen applicants and move good candidates forward.",
  },
  {
    slug: "assistants-and-knowledge",
    label: "Assistants & Knowledge",
    description: "Chat assistants that answer from your own data.",
  },
] as const;

export type TemplateCategorySlug = (typeof TEMPLATE_CATEGORIES)[number]["slug"];

export interface TemplateEntry {
  slug: string;
  title: string;
  category: TemplateCategorySlug;
  summary: string;
  problem: string;
  useCase: string;
  roles: string[];
  howItWorks: string[];
  youNeed: string[];
  staysManual: string[];
  watchOuts: string[];
  /** Slugs of published blueprints that are built on this template. */
  blueprints?: string[];
}

export interface TemplateFacts {
  sourceName: string;
  nodeCount: number;
  nodeTypes: string[];
  triggerTypes: string[];
  credentialTypes: string[];
}

export interface WorkflowTemplate extends Omit<TemplateEntry, "blueprints"> {
  blueprints: string[];
  facts: TemplateFacts;
  /** App connections read from the workflow file's node types. */
  apps: string[];
  triggers: string[];
}

const APP_NAMES: Record<string, string> = {
  airtable: "Airtable",
  airtableTool: "Airtable",
  airtableTrigger: "Airtable",
  dhl: "DHL",
  emailReadImap: "Email (IMAP)",
  emailSend: "Email (SMTP)",
  embeddingsGoogleGemini: "Google Gemini",
  embeddingsOpenAi: "OpenAI",
  facebookGraphApi: "Facebook Graph API",
  gmail: "Gmail",
  gmailTrigger: "Gmail",
  googleAnalytics: "Google Analytics",
  googleCalendar: "Google Calendar",
  googleCalendarTool: "Google Calendar",
  googleDocs: "Google Docs",
  googleDrive: "Google Drive",
  googleDriveTrigger: "Google Drive",
  googleSheets: "Google Sheets",
  googleSheetsTrigger: "Google Sheets",
  jira: "Jira",
  jiraTool: "Jira",
  lemlist: "lemlist",
  lemlistTrigger: "lemlist",
  linear: "Linear",
  linearTrigger: "Linear",
  linkedIn: "LinkedIn",
  lmChatAnthropic: "Anthropic Claude",
  lmChatGoogleGemini: "Google Gemini",
  lmChatOpenAi: "OpenAI",
  lmChatOpenRouter: "OpenRouter",
  lmOpenAi: "OpenAI",
  microsoftOutlook: "Microsoft Outlook",
  mondayCom: "Monday.com",
  notion: "Notion",
  notionTool: "Notion",
  openAi: "OpenAI",
  pipedrive: "Pipedrive",
  pipedriveTrigger: "Pipedrive",
  postgres: "Postgres",
  postgresTool: "Postgres",
  rssFeedRead: "RSS",
  slack: "Slack",
  strapi: "Strapi",
  tavilyTool: "Tavily",
  telegram: "Telegram",
  telegramTool: "Telegram",
  telegramTrigger: "Telegram",
  toolSerpApi: "SerpApi",
  twilio: "Twilio",
  twilioTrigger: "Twilio",
  vectorStorePinecone: "Pinecone",
  vectorStoreQdrant: "Qdrant",
  webflow: "Webflow",
  whatsApp: "WhatsApp",
  wooCommerce: "WooCommerce",
  wordpress: "WordPress",
  youTube: "YouTube",
};

// Ordered by how a reader thinks about "what starts this workflow".
const TRIGGER_LABELS: [string, string][] = [
  ["formTrigger", "Form submission"],
  ["chatTrigger", "Chat message"],
  ["webhook", "Incoming webhook"],
  ["gmailTrigger", "New Gmail email"],
  ["emailReadImap", "New email (IMAP)"],
  ["microsoftOutlookTrigger", "New Outlook email"],
  ["googleSheetsTrigger", "New Google Sheets row"],
  ["googleDriveTrigger", "New Google Drive file"],
  ["pipedriveTrigger", "Pipedrive event"],
  ["lemlistTrigger", "lemlist reply"],
  ["linearTrigger", "Linear issue event"],
  ["airtableTrigger", "Airtable change"],
  ["twilioTrigger", "Incoming SMS"],
  ["telegramTrigger", "Telegram message"],
  ["scheduleTrigger", "Schedule"],
  ["cron", "Schedule"],
  ["manualTrigger", "Run manually"],
];

const facts = factsJson as Record<string, TemplateFacts>;

function describe(entry: TemplateEntry): WorkflowTemplate {
  const templateFacts = facts[entry.slug];
  if (!templateFacts) {
    throw new Error(
      `Missing workflow facts for template "${entry.slug}". Run npm run templates:build.`,
    );
  }

  const apps = [
    ...new Set(
      templateFacts.nodeTypes
        .map((type) => APP_NAMES[type])
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const allTriggers = [
    ...new Set(
      TRIGGER_LABELS.filter(([type]) => templateFacts.nodeTypes.includes(type)).map(
        ([, label]) => label,
      ),
    ),
  ];
  const automaticTriggers = allTriggers.filter((label) => label !== "Run manually");

  return {
    ...entry,
    blueprints: entry.blueprints ?? [],
    facts: templateFacts,
    apps,
    triggers: automaticTriggers.length ? automaticTriggers : allTriggers,
  };
}

const TEMPLATES: WorkflowTemplate[] = TEMPLATE_ENTRIES.map(describe);

export function listTemplates(category?: string): WorkflowTemplate[] {
  return category ? TEMPLATES.filter((t) => t.category === category) : TEMPLATES;
}

export function getTemplate(slug: string): WorkflowTemplate | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplatesForBlueprint(blueprintSlug: string): WorkflowTemplate[] {
  return TEMPLATES.filter((t) => t.blueprints.includes(blueprintSlug));
}

export function getRelatedTemplates(template: WorkflowTemplate, limit: number): WorkflowTemplate[] {
  return TEMPLATES.filter((t) => t.category === template.category && t.slug !== template.slug).slice(
    0,
    limit,
  );
}

export function templateCategoryLabel(slug: string): string {
  return TEMPLATE_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
