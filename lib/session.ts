import crypto from "node:crypto";

/**
 * Gmail sign-in for the shop admin ("forgot my password"): an 8-digit code is emailed to an allowed Gmail account;
 * entering it creates a long-lived session token. Allowed accounts: ADMIN_EMAILS (comma separated) or, if unset,
 * GMAIL_USER.
 *
 * Codes and sessions are signed (HMAC) instead of stored, so they work on serverless hosting where each request can
 * land on a different instance and nothing can be written to disk. The signing secret is SESSION_SECRET, or else is
 * derived from the admin password and Gmail app password, so changing either one signs everyone out.
 */
const DAYS = 30;
const CODE_MINUTES = 10;

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.GMAIL_USER || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const sign = (data: string) =>
  crypto
    .createHmac("sha256", process.env.SESSION_SECRET || `${process.env.SHOP_ADMIN_PASSWORD ?? ""}|${process.env.GMAIL_APP_PASSWORD ?? ""}|adhz`)
    .update(data)
    .digest("hex");

const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function createSession(email: string) {
  const body = `${Buffer.from(email).toString("base64url")}.${Date.now() + DAYS * 86400000}`;
  return `${body}.${sign("session|" + body)}`;
}

export function sessionValid(token: string) {
  const [who = "", exp = "", sig = ""] = token.split(".");
  if (!sig || !same(sig, sign(`session|${who}.${exp}`))) return false;
  if (Number(exp) <= Date.now()) return false;
  return adminEmails().includes(Buffer.from(who, "base64url").toString().toLowerCase());
}

const slot = () => Math.floor(Date.now() / (CODE_MINUTES * 60000));
const codeFor = (email: string, n: number) =>
  String(parseInt(sign(`code|${email}|${n}`).slice(0, 10), 16) % 100000000).padStart(8, "0");

/** The sign-in code for this email right now. It stays the same for a few minutes, so asking twice is harmless. */
export const makeCode = (email: string) => codeFor(email, slot());

/** A code is good for the 10-minute slot it was made in and the one after it (so 10 to 20 minutes). */
export const codeValid = (email: string, code: string) => {
  const n = slot();
  return [n, n - 1].some((s) => same(code, codeFor(email, s)));
};
