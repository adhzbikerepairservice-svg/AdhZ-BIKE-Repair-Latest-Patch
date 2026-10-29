import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { emailConfigured, sendEmail } from "@/lib/mail";
import { adminEmails, codes } from "@/lib/session";

export const dynamic = "force-dynamic";

// Public: ask for a sign-in code. The answer is always the same, so nobody can probe which emails are allowed.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const reply: { ok: true; devCode?: string; notConfigured?: boolean } = { ok: true };
  if (!email || !adminEmails().includes(email)) return NextResponse.json(reply);

  const prev = codes.get(email);
  if (prev && Date.now() - prev.sent < 30000) {
    // asked again too soon: do not send another email; in development without Gmail, show the code that is still valid
    if (!emailConfigured()) return NextResponse.json({ ...reply, notConfigured: true, devCode: process.env.NODE_ENV !== "production" ? prev.code : undefined });
    return NextResponse.json({ ...reply, wait: true });
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  codes.set(email, { code, exp: Date.now() + 10 * 60000, tries: 0, sent: Date.now() });

  if (emailConfigured()) {
    const res = await sendEmail(email, "Your ADHZ admin sign-in code", `<div style="font-family:Arial,sans-serif"><p>Your sign-in code is</p><p style="font-size:30px;letter-spacing:6px;font-weight:bold;color:#1f52c4">${code}</p><p>It works for 10 minutes. If you did not ask for it, ignore this email.</p></div>`);
    if (!res.ok) reply.notConfigured = true;
  } else {
    reply.notConfigured = true;
    if (process.env.NODE_ENV !== "production") reply.devCode = code; // development only: lets you test before Gmail is connected
  }
  return NextResponse.json(reply);
}
