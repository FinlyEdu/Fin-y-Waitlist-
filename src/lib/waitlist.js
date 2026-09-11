/**
 * Waitlist signup, shared by every "join the waitlist" surface.
 *
 * Two deployment shapes, chosen at build time by VITE_WAITLIST_ENDPOINT:
 *
 * 1. SERVER MODE (endpoint unset) — the default, and where this is heading.
 *    Posts to `/api/waitlist`, a Cloudflare Pages Function beside this site
 *    (functions/api/waitlist.js). It verifies the Turnstile token and writes to
 *    Supabase with the service-role key. There is deliberately no direct
 *    Supabase call here: the table has `revoke all ... from anon`, so only the
 *    service-role key can write, and that key must never reach a browser.
 *
 * 2. STATIC MODE (endpoint set) — for hosts that cannot run server code, such
 *    as GitHub Pages. Posts straight to a Google Apps Script web app, which
 *    appends to a Sheet and emails the confirmation. Note this path cannot
 *    verify Turnstile, because verification needs a server holding the secret;
 *    the token is collected but nothing checks it. Bot protection is therefore
 *    only real in server mode.
 *
 * Local development in server mode needs the Functions runtime:
 *   npx wrangler pages dev -- npm run dev
 * Plain `npm run dev` serves the page but has no /api/waitlist to answer.
 */

const JOINED_KEY = "finy.waitlist-joined.v1";
const API = "/api/waitlist";

/** Set = static mode, posting straight to Apps Script. Unset = server mode. */
export const WAITLIST_ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT || "";

/** Fired after a successful signup so every form on the page agrees. */
export const JOINED_EVENT = "finy-waitlist-joined";

/** Public by design — Turnstile site keys are meant to appear in page source. */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

// Deliberately permissive: one @, a dotted domain, no whitespace. Stricter
// patterns reject addresses that really do deliver, and every false rejection
// is a lost signup. The server and the database validate again.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

/** Mirrors the CHECK constraint on waitlist_signups.role. */
export const ROLES = [
  { value: "learner", label: "I'm a learner" },
  { value: "parent-educator", label: "Parent or teacher" },
  { value: "school-organization", label: "School or org" },
];

export const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

/** Returns a human-readable problem with `value`, or "" when it looks sendable. */
export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return "Enter your email to save your spot.";
  if (!EMAIL_PATTERN.test(email)) return "That doesn't look like an email address.";
  return "";
}

/** The address this browser already signed up with, so a reload keeps the success state. */
export function getJoinedEmail() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeEmail(JSON.parse(localStorage.getItem(JOINED_KEY)) ?? "");
  } catch {
    return "";
  }
}

function rememberJoined(email) {
  try {
    localStorage.setItem(JOINED_KEY, JSON.stringify(email));
  } catch {
    // Private browsing can refuse writes. The signup is already saved server
    // side; the only cost is that a reload shows the form again.
  }
}

/**
 * Adds `value` to the waitlist.
 * Resolves to `{ email, alreadyJoined }`; rejects with a message safe to show.
 */
export async function joinWaitlist(value, { source = "hero", role = "learner", turnstileToken = "" } = {}) {
  const email = normalizeEmail(value);
  const problem = validateEmail(email);
  if (problem) throw new Error(problem);

  // Static mode sends the Apps Script contract: text/plain keeps it a "simple"
  // CORS request, which Apps Script needs because it cannot answer a preflight.
  const request = WAITLIST_ENDPOINT
    ? {
        url: WAITLIST_ENDPOINT,
        init: {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, source }),
        },
      }
    : {
        url: API,
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role, source, turnstileToken }),
        },
      };

  let response;
  try {
    response = await fetch(request.url, request.init);
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 404) {
    // Plain `vite dev` serves the page without the Functions runtime.
    throw new Error(
      import.meta.env.DEV
        ? "No /api/waitlist here — run `npx wrangler pages dev` to serve the function locally."
        : "We couldn't save your spot. Please try again in a moment.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "We couldn't save your spot. Please try again in a moment.");
  }

  const alreadyJoined = Boolean(payload.alreadyJoined);
  rememberJoined(email);
  // The page can carry more than one form. Signing up in the footer should not
  // leave the hero still asking for an address.
  window.dispatchEvent(new CustomEvent(JOINED_EVENT, { detail: { email, alreadyJoined } }));
  return { email, alreadyJoined };
}
