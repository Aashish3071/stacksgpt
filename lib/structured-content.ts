import { z } from "zod";
const text = z.string().trim().min(1).max(3000);
export const structuredVerdictSchema = z
  .object({
    whoShouldUse: text.optional(),
    limitations: text.optional(),
    pricing: text.optional(),
    recommendation: text.optional(),
  })
  .strict();
export const additionalSourcesSchema = z
  .array(
    z
      .object({
        name: text,
        url: z
          .url()
          .refine(
            (v) =>
              v.startsWith("https://") &&
              !new URL(v).username &&
              !new URL(v).password,
          ),
        publishedAt: z.iso.datetime().optional(),
        retrievedAt: z.iso.datetime().optional(),
      })
      .strict(),
  )
  .max(20);
export const jargonSchema = z
  .array(z.object({ technicalTerm: text, plainEnglish: text }).strict())
  .max(30);
export const workflowSchema = z
  .array(
    z
      .object({
        title: text,
        targetAudience: text,
        stepByStep: z.array(text).min(1).max(20),
        promptTemplate: text.optional(),
      })
      .strict(),
  )
  .max(20);
