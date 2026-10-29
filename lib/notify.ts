import { emailConfigured, sendEmail } from "./mail";

/**
 * Alerts for the shop owner (new booking, chat message, deposit, e-wallet payment):
 *  - Gmail: an email to ALERT_EMAIL (default: the shop Gmail itself). Open that Gmail account in the Gmail app on the
 *    phone and every alert arrives as a normal notification. Needs GMAIL_USER and GMAIL_APP_PASSWORD (see lib/mail.ts).
 *  - ntfy (optional): a push through the ntfy app if NTFY_TOPIC is set.
 * Nothing here ever blocks or breaks the caller.
 */
export const alertAddress = () => process.env.ALERT_EMAIL || process.env.GMAIL_USER || "";

export async function sendAlertEmail(title: string, message: string, link?: string) {
  const to = alertAddress();
  if (!emailConfigured() || !to) return { ok: false, error: "Gmail is not set up (GMAIL_USER and GMAIL_APP_PASSWORD)" };
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return sendEmail(to, `[ADHZ] ${title}`, `<div style="font-family:Arial,sans-serif;max-width:480px"><h3 style="margin:0 0 8px;color:#1f52c4">${esc(title)}</h3><p>${esc(message)}</p>${link ? `<p><a href="${link}" style="background:#1f52c4;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open the admin</a></p>` : ""}</div>`);
}

export function notifyOwner(title: string, message: string, click?: string) {
  sendAlertEmail(title, message, click).catch(() => {});
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const headers: Record<string, string> = { Title: title, Priority: "high", Tags: "bike" };
  if (click) headers.Click = click;
  fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: "POST", headers, body: message.slice(0, 400), signal: AbortSignal.timeout(5000) }).catch(() => {});
}
