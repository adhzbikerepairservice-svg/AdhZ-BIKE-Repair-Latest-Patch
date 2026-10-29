import { NextResponse } from "next/server";
import { codes, createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Public: trade a correct 6-digit code for a session key. Five wrong tries burn the code.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  const c = codes.get(email);
  if (!c || c.exp < Date.now()) return NextResponse.json({ error: "expired" }, { status: 400 });
  c.tries += 1;
  if (c.tries > 5) {
    codes.delete(email);
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }
  if (code !== c.code) return NextResponse.json({ error: "wrong" }, { status: 400 });
  codes.delete(email);
  return NextResponse.json({ ok: true, key: "session:" + createSession(email) });
}
