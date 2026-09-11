/**
 * Mailchimp Marketing API integration for newsletter subscriptions.
 *
 * Configured via:
 * - MAILCHIMP_API_KEY (e.g. "xxxxxxxxxxxxxxxxxxxx-us21")
 * - MAILCHIMP_LIST_ID (The Audience/List ID)
 * - MAILCHIMP_SERVER_PREFIX (Optional, auto-derived from the API key suffix)
 */

export function mailchimpConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_API_KEY &&
    (process.env.MAILCHIMP_LIST_ID || process.env.MAILCHIMP_AUDIENCE_ID)
  );
}

function getServerPrefix(apiKey: string): string {
  if (process.env.MAILCHIMP_SERVER_PREFIX) {
    return process.env.MAILCHIMP_SERVER_PREFIX;
  }
  const parts = apiKey.split("-");
  return parts.length === 2 ? parts[1] : "us1";
}

export async function syncToMailchimp(email: string): Promise<{
  ok: boolean;
  status?: string;
  error?: string;
}> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId =
    process.env.MAILCHIMP_LIST_ID || process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !listId) {
    return { ok: false, error: "Mailchimp is not configured." };
  }

  const serverPrefix = getServerPrefix(apiKey);
  const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${apiKey}`,
      },
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        status: "subscribed",
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return { ok: true, status: data.status || "subscribed" };
    }

    // Handle already existing member
    if (data.title === "Member Exists" || data.status === 400) {
      return { ok: true, status: "already_subscribed" };
    }

    console.warn("Mailchimp subscription warning:", data.detail || data.title);
    return { ok: false, error: data.detail || data.title };
  } catch (err) {
    console.warn("Failed to sync subscriber to Mailchimp:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mailchimp sync failed",
    };
  }
}
