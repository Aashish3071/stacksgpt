import { GoogleGenerativeAI } from "@google/generative-ai";

export interface DecodedArticlePayload {
  title: string;
  summary: string;
  toolName: string;
  toolCategory: string;
  keyPoints: string[];
  body: string;
  verdict: string;
  jargonTranslations: Array<{
    technicalTerm: string;
    plainEnglish: string;
  }>;
  useCases: Array<{
    title: string;
    targetAudience: string;
    stepByStep: string[];
    promptTemplate?: string;
  }>;
}

export async function transformRawUpdateToArticle(
  rawNewsContent: string,
  sourceUrl: string,
  sourceAuthor?: string
): Promise<DecodedArticlePayload> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length < 6) {
    throw new Error(
      "GEMINI_API_KEY is not set. The built-in writer is disabled; articles come from content/articles/."
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are the Chief Editor for Stacksgpt, a modern AI & tech news website explaining tech developments to non-technical readers (freelancers, small business owners, managers, everyday users).

CRITICAL FORMAT RULES:
1. THIS IS A NEWS WEBSITE, NOT A DIY TUTORIAL BLOG.
2. DO NOT write step-by-step tutorial instructions (no "Step 1: Install Ollama", "Step 2: Disconnect wifi").
3. DO NOT include copy-paste prompts of any kind.
4. DO NOT create jargon-versus-definition dictionary tables.
5. Provide a scannable pointer summary:
   - WHAT'S NEW: 2-5 bullet points summarizing what was shipped, announced, or changed.
   - WHY IT MATTERS: A concise paragraph / verdict explaining why a regular person or business should care.
6. The body MUST be reported news prose (2-4 paragraphs) covering:
   - What happened and what the tool/model is like in plain English.
   - Who it affects and what it costs or requires.
   - Stated limitations or catches.
7. Only state facts from the source text. Never invent version numbers, benchmarks, pricing, or quotes.

Respond in STRICT JSON with this schema:
{
  "title": "Plain English news headline stating what happened or what the model is like",
  "summary": "One paragraph standfirst in plain English explaining why a normal person should care",
  "toolName": "Name of the AI tool, model, or company",
  "toolCategory": "Productivity | Writing | Coding | Research | Design | Automation",
  "keyPoints": [
    "What's new bullet 1",
    "What's new bullet 2",
    "What's new bullet 3"
  ],
  "body": "Reported news prose written in journalistic style explaining the announcement...",
  "verdict": "Clear, honest advice on why it matters and whether it is worth paying for"
}

Raw Announcement / Source text:
${rawNewsContent}

Source URL: ${sourceUrl}
Source Author: ${sourceAuthor || "Tech Source"}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) throw new Error("Model returned an empty response.");

    const parsed = JSON.parse(text.trim());
    return {
      title: parsed.title,
      summary: parsed.summary,
      toolName: parsed.toolName || "AI Tool",
      toolCategory: parsed.toolCategory || "Productivity",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      body: parsed.body || "",
      verdict: parsed.verdict || "",
      jargonTranslations: [],
      useCases: [],
    };
  } catch (err) {
    throw new Error(`Gemini writer failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
