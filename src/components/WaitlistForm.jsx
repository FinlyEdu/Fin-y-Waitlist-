import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  JOINED_EVENT,
  ROLES,
  TURNSTILE_SITE_KEY,
  getJoinedEmail,
  joinWaitlist,
  validateEmail,
} from "@/lib/waitlist";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Loads the Turnstile script once, however many forms are on the page. */
let turnstileScript = null;
function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
  return turnstileScript;
}

/**
 * Email capture for the early-access waitlist.
 *
 * The submit goes to /api/waitlist, which verifies the Turnstile token before
 * writing to Supabase. The widget renders in "interaction-only" mode, so it
 * stays invisible unless Cloudflare actually wants to challenge the visitor —
 * the form keeps its one-line shape in the common case.
 */
export default function WaitlistForm({
  source = "hero",
  className = "",
  placeholder = "you@email.com",
  cta = "Join the waitlist",
  note = "Early access and product updates. No spam — unsubscribe any time.",
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0].value);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | joined
  const [joinedEmail, setJoinedEmail] = useState("");
  const [joinKind, setJoinKind] = useState("known");

  const inputRef = useRef(null);
  const widgetRef = useRef(null);
  const widgetId = useRef(null);
  const tokenRef = useRef("");

  // More than one form can share a page (hero and footer), so the ids that
  // wire up the label, the error and the note have to be per-instance.
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const noteId = `${fieldId}-note`;

  // A returning visitor who already signed up should see the confirmation, not
  // an empty field — and so should the other form the moment either succeeds.
  useEffect(() => {
    const sync = (event) => {
      const saved = getJoinedEmail();
      if (!saved) return;
      setJoinedEmail(saved);
      if (event?.detail) setJoinKind(event.detail.alreadyJoined ? "known" : "new");
      setStatus("joined");
    };
    sync();
    window.addEventListener(JOINED_EVENT, sync);
    return () => window.removeEventListener(JOINED_EVENT, sync);
  }, []);

  // Render the widget once the form is on screen. Without a site key we skip
  // it entirely and let the server reject the submit, rather than pretending.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || status === "joined" || !widgetRef.current) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetRef.current || widgetId.current !== null) return;
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          callback: (token) => {
            tokenRef.current = token;
          },
          "expired-callback": () => {
            tokenRef.current = "";
          },
          "error-callback": () => {
            tokenRef.current = "";
          },
        });
      })
      .catch(() => setError("Couldn't load the security check. Reload and try again."));

    return () => {
      cancelled = true;
    };
  }, [status]);

  const resetWidget = useCallback(() => {
    tokenRef.current = "";
    if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
  }, []);

  const handleChange = (event) => {
    setEmail(event.target.value);
    // Only re-validate while an error is on screen, so the message clears as
    // soon as they fix it without nagging mid-typing on the first attempt.
    if (error) setError(validateEmail(event.target.value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === "submitting") return;

    const problem = validateEmail(email);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }

    setError("");
    setStatus("submitting");
    try {
      const result = await joinWaitlist(email, { source, role, turnstileToken: tokenRef.current });
      setJoinedEmail(result.email);
      setJoinKind(result.alreadyJoined ? "known" : "new");
      setStatus("joined");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("idle");
      // A Turnstile token is single-use; retrying with the spent one would fail.
      resetWidget();
      inputRef.current?.focus();
    }
  };

  if (status === "joined") {
    // Only promise a confirmation email when one was really sent: a repeat
    // signup is not emailed again.
    const emailed = joinKind === "new";
    return (
      <div className={`max-w-md ${className}`}>
        <div
          className="waitlist-success flex items-center gap-3.5 rounded-2xl sm:rounded-full hairline border border-vermillion/35 bg-vermillion/10 px-5 py-3.5"
          role="status"
          aria-live="polite"
        >
          <span className="waitlist-success-check grid h-8 w-8 shrink-0 place-items-center rounded-full bg-vermillion text-white">
            <Check size={17} strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-ink">
              {joinKind === "new" ? "You're on the list!" : "You're already on the list!"}
            </span>
            <span className="block text-sm text-ink/55">
              {emailed
                ? `Check ${joinedEmail} for your confirmation.`
                : `We'll email ${joinedEmail} the moment your seat opens.`}
            </span>
          </span>
        </div>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className={`max-w-md ${className}`}>
      <fieldset className="mb-3 flex flex-wrap gap-2" disabled={submitting}>
        <legend className="sr-only">Who are you signing up as?</legend>
        {ROLES.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-full hairline border px-3.5 py-1.5 text-[13px] transition-colors ${
              role === option.value
                ? "border-vermillion bg-vermillion/10 text-ink"
                : "border-border text-ink/50 hover:border-ink/30"
            }`}
          >
            <input
              type="radio"
              name={`${fieldId}-role`}
              value={option.value}
              checked={role === option.value}
              onChange={() => setRole(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div
        className={`flex flex-col gap-2 rounded-[28px] hairline border bg-white p-1.5 transition-colors sm:flex-row sm:items-center sm:rounded-full ${
          error ? "border-destructive" : "border-border focus-within:border-ink/40"
        }`}
      >
        <label htmlFor={fieldId} className="sr-only">
          Email address
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          onBlur={() => email && setError(validateEmail(email))}
          placeholder={placeholder}
          autoComplete="email"
          spellCheck="false"
          disabled={submitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : noteId}
          className="h-11 min-w-0 flex-1 bg-transparent px-5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="group flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-vermillion px-6 font-medium text-white shadow-[0_8px_24px_-8px_rgba(40,199,111,0.6)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Joining…
            </>
          ) : (
            <>
              {cta}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </div>

      {/* Stays empty unless Cloudflare decides this visitor needs challenging. */}
      <div ref={widgetRef} className="mt-2 empty:mt-0" />

      {error ? (
        <p id={errorId} role="alert" className="mt-2.5 pl-5 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p id={noteId} className="mt-2.5 pl-5 text-sm text-ink/45">
          {note}
        </p>
      )}
    </form>
  );
}
