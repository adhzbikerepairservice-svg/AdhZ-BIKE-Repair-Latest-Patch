import { NextResponse } from "next/server";
import { adminEmails, codeValid, createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Public: trade a correct 8-digit code for a session key.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!adminEmails().includes(email) || !codeValid(email, code)) return NextResponse.json({ error: "wrong" }, { status: 400 });
  return NextResponse.json({ ok: true, key: "session:" + createSession(email) });
}
