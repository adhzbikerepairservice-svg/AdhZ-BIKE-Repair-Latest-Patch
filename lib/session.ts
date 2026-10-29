import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Gmail sign-in for the shop admin: a 6-digit code is emailed to an allowed Gmail account; entering it creates a
 * long-lived session token. Allowed accounts: ADMIN_EMAILS (comma separated) or, if unset, GMAIL_USER.
 */
const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "sessions.json");
const DAYS = 30;

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.GMAIL_USER || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

type Sessions = Record<string, { email: string; exp: number }>;
const load = (): Sessions => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
};
const save = (s: Sessions) => {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(s));
};
const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export function createSession(email: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const s = load();
  const now = Date.now();
  for (const k of Object.keys(s)) if (s[k].exp < now) delete s[k];
  s[hash(token)] = { email, exp: now + DAYS * 86400000 };
  save(s);
  return token;
}

export function sessionValid(token: string) {
  const e = load()[hash(token)];
  return !!e && e.exp > Date.now();
}

// one-time codes live in memory (they last 10 minutes)
const g = globalThis as unknown as { __adhzCodes?: Map<string, { code: string; exp: number; tries: number; sent: number }> };
export const codes = (g.__adhzCodes ??= new Map());
