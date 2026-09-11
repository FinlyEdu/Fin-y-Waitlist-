# fin!y — waitlist

The standalone early-access landing page for [fin!y](https://github.com/Evan1108-Coder/finly).
One job: explain the product in a screen, capture an email, confirm it.

Vite + React + Tailwind. The page itself is a static build; signups go to a
Google Apps Script web app that writes them to a Google Sheet and emails the
person back.

## Run it

```bash
npm install
npm run dev
```

The dev server comes up on http://localhost:4173.

## Where the emails go

Signups are `POST {email, source}` to whatever URL is in `VITE_WAITLIST_ENDPOINT`.

**With no endpoint set, signups are kept in the visitor's own browser and go
nowhere else** — no sheet row, no confirmation email. That keeps the form
working while you build (and the success message honestly drops its "check your
inbox" line), but the page collects nothing until you set the variable.

### Setting up the Sheet and the confirmation email

`google-apps-script/Code.gs` is the whole backend. It appends a row to a Google
Sheet and sends the person a confirmation email from the Google account that
owns the script. No API keys, no third-party service, nothing secret in this
repo.

1. Create a Google Sheet — name it something like **fin!y waitlist**. This is
   the doc you'll open to see who has signed up.
2. In that sheet: **Extensions → Apps Script**.
3. Delete the placeholder `function myFunction() {}` and paste in the entire
   contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs). Save.
4. Pick `testSetup` from the function dropdown and press **Run**. Google will
   ask you to authorise the script — it needs permission to edit the sheet and
   to send mail as you. Approve it. (On the "Google hasn't verified this app"
   screen: **Advanced → Go to \<project\> (unsafe)**. That warning is normal for
   your own unpublished script.) This creates the `Signups` tab and sends you a
   copy of the confirmation email so you can see exactly what a signup gets.
5. **Deploy → New deployment → Web app**, with:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Copy the **Web app URL** (it ends in `/exec`) into `.env.local`:

   ```
   VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/AKfy…/exec
   ```

7. Restart `npm run dev` — Vite only reads env at startup — and submit a test
   address. A row appears in the sheet and the confirmation lands in the inbox.

Opening the `/exec` URL in a browser returns a small JSON status with the
current signup count, which is a quick way to check a deployment is live.

**After editing `Code.gs` you must redeploy** (Deploy → Manage deployments →
edit → Version: New version). Saving alone does not update the live URL.

**Sending limits:** a consumer Gmail account can send 100 emails a day, Google
Workspace 1500. Past that the row is still written and the sheet's
`Confirmation` column records the failure, so nothing is lost — but people stop
being emailed. Worth knowing before a launch push.

### Using something else instead

Any endpoint that accepts the same POST works. Note that the request is sent as
`text/plain` on purpose: that keeps it a "simple" CORS request with no preflight,
which Apps Script cannot answer. A provider that requires a real
`application/json` content type (Formspree, for instance) needs that header
changed in `src/lib/waitlist.js` — it is commented there.

## Ship it

```bash
npm run build
```

Outputs a static `dist/` that can be served from anywhere. `netlify.toml` in
this repo configures the live deploy.

### Live on finlyedu.com (Netlify)

This project lives at the root of the `waitlist` branch of
`Evan1108-Coder/finly`, so Netlify points at that repo and branch with **no
base directory**. `netlify.toml` supplies the build command, publish
directory and Node version, so the defaults offered during setup can be
accepted as-is.

1. Netlify → **Add new site → Import an existing project → GitHub**, authorise,
   pick `Evan1108-Coder/finly`.
2. Set **Branch to deploy: `waitlist`**. Leave build command and publish
   directory alone — `netlify.toml` sets them.
3. **Site configuration → Environment variables** → add
   `VITE_WAITLIST_ENDPOINT` with the Apps Script `/exec` URL. Do this *before*
   the first real traffic: without it the form silently drops every signup into
   the visitor's own browser.
4. **Domain management → Add a custom domain** → `finlyedu.com`. Netlify will
   name the site something like `fancy-name-123.netlify.app`.
5. In Porkbun DNS, repoint the two hostname records at that Netlify subdomain:

   | Type | Host | Value |
   | --- | --- | --- |
   | ALIAS | `finlyedu.com` | `<site>.netlify.app` |
   | CNAME | `*.finlyedu.com` | `<site>.netlify.app` |

   **Leave the two MX records and the SPF TXT record alone** — those run
   Porkbun email forwarding for the domain and have nothing to do with the
   site. The `_acme-challenge` TXT records belong to a previous certificate and
   can stay; Netlify issues its own.

6. Wait for DNS to propagate, then let Netlify provision the certificate
   (Domain management → HTTPS → Verify / Provision).

Because Vite inlines env vars at build time, changing `VITE_WAITLIST_ENDPOINT`
requires a redeploy — **Deploys → Trigger deploy → Clear cache and deploy site** —
not just saving the new value.

## Layout

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The whole page — hero, value props, closing CTA, footer |
| `src/components/WaitlistForm.jsx` | Email pill, inline validation, success state |
| `src/lib/waitlist.js` | Validation and submit; the only file that knows about the endpoint |
| `src/components/BudgetPreview.jsx` | The draggable 50/30/20 budgeting lesson in the hero |
| `src/index.css` | Brand tokens, fonts, animations |
| `google-apps-script/Code.gs` | The sheet + confirmation-email backend |

Both forms on the page (hero and footer) share a `finy-waitlist-joined` event,
so signing up in one settles the other too.

Brand tokens (`ink`, `paper`, `vermillion`, `border`) live in
`tailwind.config.js` and mirror the main app's CSS variables. Note that
`vermillion` is the fin!y green — validation errors deliberately use
`destructive` instead so a failure never renders in the success colour.
