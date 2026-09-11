/**
 * fin!y waitlist endpoint — Google Apps Script.
 *
 * Bound to a Google Sheet, deployed as a Web App, this does two jobs on every
 * signup: append a row to the sheet, and send the person a confirmation email
 * from the Google account that owns the script.
 *
 * Setup lives in ../README.md under "Where the emails go". In short:
 *   Sheet → Extensions → Apps Script → paste this → Deploy → Web app
 *   (Execute as: Me · Who has access: Anyone) → copy the /exec URL into
 *   VITE_WAITLIST_ENDPOINT.
 */

const SHEET_NAME = "Signups";
const HEADERS = ["Joined at", "Email", "Source", "Confirmation"];
const FROM_NAME = "fin!y";
const SUBJECT = "You're on the fin!y waitlist";

/** Permissive on purpose: every false rejection here is a lost signup. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

function doPost(e) {
  try {
    // The browser sends this as text/plain so the request stays "simple" and
    // never triggers a CORS preflight, which Apps Script cannot answer.
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "unknown").slice(0, 60);

    if (!EMAIL_PATTERN.test(email)) {
      return json({ ok: false, error: "That doesn't look like an email address." });
    }

    const sheet = getSheet_();
    const lock = LockService.getScriptLock();
    // Two people submitting at once must not race into duplicate rows.
    lock.waitLock(15000);

    let row;
    let alreadyJoined;
    try {
      row = findRow_(sheet, email);
      alreadyJoined = row > 0;
      if (!alreadyJoined) {
        sheet.appendRow([new Date(), email, source, "sending"]);
        row = sheet.getLastRow();
      }
    } finally {
      lock.releaseLock();
    }

    // Someone who signed up twice should not get the same email twice.
    if (!alreadyJoined) {
      try {
        sendConfirmation_(email);
        sheet.getRange(row, 4).setValue("sent " + formatStamp_(new Date()));
      } catch (mailError) {
        // The signup is already recorded, which is the part that matters. Log
        // the failure in the row so a bounced quota is visible in the sheet.
        sheet.getRange(row, 4).setValue("FAILED: " + mailError.message);
      }
    }

    return json({ ok: true, alreadyJoined: alreadyJoined });
  } catch (error) {
    return json({ ok: false, error: "We couldn't save your spot. Please try again in a moment." });
  }
}

/** Visiting the /exec URL in a browser should say something useful. */
function doGet() {
  const sheet = getSheet_();
  return json({ ok: true, service: "finy-waitlist", signups: Math.max(0, sheet.getLastRow() - 1) });
}

function sendConfirmation_(email) {
  MailApp.sendEmail({
    to: email,
    name: FROM_NAME,
    subject: SUBJECT,
    body: [
      "You're in.",
      "",
      "Thanks for joining the fin!y waitlist. You're on the list for early access,",
      "and we'll email you the moment your seat opens.",
      "",
      "fin!y is a personal finance tutor: short interactive lessons on budgeting,",
      "investing and markets that you work through rather than watch. 15 minutes a day.",
      "",
      "Nothing to do for now — we'll come to you.",
      "",
      "— The fin!y team",
      "",
      "Didn't sign up, or changed your mind? Just reply to this email and we'll take you off the list.",
    ].join("\n"),
    htmlBody: confirmationHtml_(),
  });
}

function confirmationHtml_() {
  return [
    '<div style="margin:0;padding:32px 16px;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#1A1A1A;">',
    '<div style="max-width:520px;margin:0 auto;">',
    '<div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#8a8a8a;">fin!y</div>',
    '<h1 style="margin:22px 0 0;font-size:30px;line-height:1.2;font-weight:600;">You&rsquo;re in.</h1>',
    '<p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:#4a4a4a;">',
    'Thanks for joining the fin!y waitlist. You&rsquo;re on the list for early access, and we&rsquo;ll email you the moment your seat opens.',
    "</p>",
    '<p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:#4a4a4a;">',
    'fin!y is a personal finance tutor: short interactive lessons on budgeting, investing and markets that you work through rather than watch. Fifteen minutes a day.',
    "</p>",
    '<div style="margin:28px 0;padding:16px 20px;background:#F2FBF6;border-left:3px solid #28C76F;border-radius:6px;font-size:15px;line-height:1.6;color:#1A1A1A;">',
    "Nothing to do for now — we&rsquo;ll come to you.",
    "</div>",
    '<p style="margin:0;font-size:16px;line-height:1.65;color:#4a4a4a;">&mdash; The fin!y team</p>',
    '<p style="margin:32px 0 0;padding-top:18px;border-top:1px solid #ececec;font-size:13px;line-height:1.6;color:#9a9a9a;">',
    "Didn&rsquo;t sign up, or changed your mind? Reply to this email and we&rsquo;ll take you off the list.",
    "</p>",
    "</div></div>",
  ].join("");
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 260);
    sheet.setColumnWidth(4, 220);
  }
  return sheet;
}

function findRow_(sheet, email) {
  const rows = sheet.getLastRow();
  if (rows < 2) return 0;
  const values = sheet.getRange(2, 2, rows - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return 0;
}

function formatStamp_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Run this once from the Apps Script editor to create the sheet, grant the
 * script its permissions, and send yourself a copy of the confirmation email
 * so you can see what a signup receives.
 */
function testSetup() {
  getSheet_();
  const me = Session.getEffectiveUser().getEmail();
  sendConfirmation_(me);
  Logger.log("Sheet ready. Sample confirmation sent to " + me);
}
