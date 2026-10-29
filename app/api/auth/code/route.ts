import { NextResponse } from "next/server";
import { emailConfigured, sendEmail } from "@/lib/mail";
import { adminEmails, makeCode } from "@/lib/session";

export const dynamic = "force-dynamic";

// best-effort cooldown so the page cannot be used to flood the inbox (per server instance)
const g = globalThis as unknown as { __adhzSent?: Map<string, number> };
const sentAt = (g.__adhzSent ??= new Map());

// Public: ask for a sign-in code. The answer is always the same, so nobody can probe which emails are allowed.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const reply: { ok: true; devCode?: string; notConfigured?: boolean; wait?: boolean } = { ok: true };
  if (!email || !adminEmails().includes(email)) return NextResponse.json(reply);

  const code = makeCode(email);
  if (!emailConfigured()) {
    reply.notConfigured = true;
    if (process.env.NODE_ENV !== "production") reply.devCode = code; // development only: lets you test before Gmail is connected
    return NextResponse.json(reply);
  }
  if (Date.now() - (sentAt.get(email) ?? 0) < 30000) return NextResponse.json({ ...reply, wait: true });
  sentAt.set(email, Date.now());

  const res = await sendEmail(email, "Your ADHZ admin sign-in code", `<div style="font-family:Arial,sans-serif"><p>Your sign-in code is</p><p style="font-size:30px;letter-spacing:6px;font-weight:bold;color:#1f52c4">${code}</p><p>It works for at least 10 minutes. If you did not ask for it, ignore this email.</p></div>`);
  if (!res.ok) reply.notConfigured = true;
  return NextResponse.json(reply);
}
