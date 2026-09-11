/**
 * Waitlist endpoint — a Cloudflare Pages Function.
 *
 * Adapted from the implementation on the `waitlist-page` branch of the main
 * app repo, which is where this project's Supabase table and Turnstile keys
 * came from.
 *
 * This runs server-side, which is the whole reason it exists: the Supabase
 * table has `revoke all ... from anon`, so a browser cannot write to it. Only
 * this function, holding the service-role key, can — and it does so only after
 * Cloudflare has confirmed the submitter is human.
 *
 * Required environment variables (set in Cloudflare Pages, never in the repo):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY
 * Optional:
 *   CONFIRMATION_ENDPOINT — Apps Script /exec URL that emails the person.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Both sets mirror CHECK constraints on the table; a value outside them would
// be rejected by Postgres anyway, so reject it here with a readable message.
const ROLES = new Set(["learner", "parent-educator", "school-organization"]);
const SOURCES = new Set(["hero", "footer"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function verifyTurnstile(token, secret, request) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.append("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

/**
 * Fire the confirmation email. Deliberately not awaited into the response path:
 * the signup is already saved, and a mail outage should not tell the person
 * their signup failed and push them to submit again.
 */
async function sendConfirmation(endpoint, email, source) {
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ email, source }),
    });
  } catch (error) {
    console.error("Confirmation email failed", { message: error.message });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TURNSTILE_SECRET_KEY"].filter(
    (name) => !env[name],
  );
  if (missing.length) {
    console.error("Waitlist misconfigured; missing:", missing.join(", "));
    return json({ error: "The waitlist is not ready yet. Please check back shortly." }, 503);
  }

  let submission;
  try {
    submission = await request.json();
  } catch {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const email = typeof submission.email === "string" ? submission.email.trim().toLowerCase() : "";
  const role = typeof submission.role === "string" ? submission.role : "";
  const source = typeof submission.source === "string" ? submission.source : "";
  const turnstileToken = typeof submission.turnstileToken === "string" ? submission.turnstileToken : "";

  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    return json({ error: "That doesn't look like an email address." }, 400);
  }
  if (!ROLES.has(role) || !SOURCES.has(source)) {
    return json({ error: "Please check your details and try again." }, 400);
  }
  if (!turnstileToken) {
    return json({ error: "Please complete the security check, then try again." }, 400);
  }

  if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, request))) {
    return json({ error: "The security check did not pass. Please try again." }, 400);
  }

  // Ask for the row back so a repeat signup can be told apart from a new one:
  // created_at stays at its original value on conflict, so an unchanged
  // timestamp means this address was already on the list.
  const supabase = await fetch(
    `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/waitlist_signups?on_conflict=email`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({ email, role, source }),
    },
  );

  if (!supabase.ok) {
    console.error("Waitlist insert failed", { status: supabase.status });
    return json({ error: "We could not save your place. Please try again." }, 502);
  }

  const rows = await supabase.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  const alreadyJoined = Boolean(row && row.created_at !== row.updated_at);

  if (!alreadyJoined) {
    context.waitUntil(sendConfirmation(env.CONFIRMATION_ENDPOINT, email, source));
  }

  return json({ ok: true, alreadyJoined });
}

/** Anything that is not a POST. */
export function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
