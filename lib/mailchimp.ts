import crypto from "node:crypto";

/**
 * Mailchimp Marketing API integration for newsletter subscriptions.
 *
 * Configured via:
 * - MAILCHIMP_API_KEY (e.g. "xxxxxxxxxxxxxxxxxxxx-us21")
 * - MAILCHIMP_LIST_ID (The Audience/List ID)
 * - MAILCHIMP_SERVER_PREFIX (Optional, auto-derived from the API key suffix)
 */

type MailchimpResult = { ok: boolean; status?: string; error?: string };

export function mailchimpConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_API_KEY &&
    (process.env.MAILCHIMP_LIST_ID || process.env.MAILCHIMP_AUDIENCE_ID)
  );
}

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID || process.env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !listId) return null;

  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || apiKey.split("-")[1] || "us1";
  return {
    membersUrl: `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
    authorization: `Basic ${Buffer.from(`stacksgpt:${apiKey}`).toString("base64")}`,
  };
}

function memberUrl(membersUrl: string, email: string): string {
  const hash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
  return `${membersUrl}/${hash}`;
}

async function mailchimpRequest(
  url: string,
  authorization: string,
  method: "PUT" | "POST" | "PATCH",
  body: unknown,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: authorization },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  // Some endpoints (such as tags) reply with no body.
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, data };
  return { ok: false, error: String(data.detail || data.title || `Mailchimp returned ${res.status}`) };
}

export async function syncToMailchimp(
  email: string,
  { tags = [] }: { tags?: string[] } = {},
): Promise<MailchimpResult> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Mailchimp is not configured." };

  const url = memberUrl(config.membersUrl, email);
  try {
    // status_if_new only applies to new contacts, so anyone who unsubscribed stays unsubscribed.
    const upsert = await mailchimpRequest(url, config.authorization, "PUT", {
      email_address: email.toLowerCase().trim(),
      status_if_new: "subscribed",
    });
    if (!upsert.ok) return { ok: false, error: upsert.error };

    const status = typeof upsert.data.status === "string" ? upsert.data.status : undefined;
    const activeTags = tags.filter(Boolean);
    if (activeTags.length > 0) {
      const tagged = await mailchimpRequest(`${url}/tags`, config.authorization, "POST", {
        tags: activeTags.map((name) => ({ name, status: "active" })),
      });
      if (!tagged.ok) return { ok: false, status, error: `Tagging failed: ${tagged.error}` };
    }

    return { ok: true, status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Mailchimp sync failed" };
  }
}

export async function unsubscribeFromMailchimp(email: string): Promise<MailchimpResult> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Mailchimp is not configured." };

  try {
    const result = await mailchimpRequest(memberUrl(config.membersUrl, email), config.authorization, "PATCH", {
      status: "unsubscribed",
    });
    return result.ok ? { ok: true, status: "unsubscribed" } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Mailchimp unsubscribe failed" };
  }
}
