import { NextResponse } from "next/server";
import { assistantReply } from "@/lib/assistant";
import { isOwner } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";
import { markOwnerSeen, ownerAway, threads } from "@/lib/chat";

export const dynamic = "force-dynamic";

const ANSWER_WAIT_MS = 8 * 1000;
const pending = new Set<string>(); // threads the assistant is already answering

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const validId = (id: string) => /^[a-z0-9-]{8,64}$/i.test(id);

// Customer: ?id=<their chat id> returns their messages and whether the mechanic is away.
// Owner: ?all=1 returns every conversation (newest activity first) and counts as "the mechanic is here".
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("all")) {
    if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    markOwnerSeen();
    const list = [...threads.values()].sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
    return NextResponse.json({ threads: list });
  }
  const id = url.searchParams.get("id") ?? "";
  const t = validId(id) ? threads.get(id) : undefined;

  // Mechanic is on the dashboard but has not answered for 8 seconds: the assistant steps in so nobody waits.
  const last = t?.messages.at(-1);
  if (t && last?.from === "customer" && Date.now() - last.at > ANSWER_WAIT_MS && !pending.has(t.id)) {
    pending.add(t.id);
    assistantReply(t.messages)
      .then((reply) => {
        if (t.messages.at(-1)?.from === "customer") t.messages.push({ from: "ai", text: reply, at: Date.now() });
      })
      .finally(() => pending.delete(t.id));
  }
  return NextResponse.json({ name: t?.name ?? "", messages: t?.messages ?? [], away: ownerAway() });
}

// Customer sends { id, name, text }. Owner replies with { id, text, reply: true }; { id, read: true } marks a thread read.
export async function POST(req: Request) {
  const body = await req.json();
  const id = str(body.id, 64);
  if (!validId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (body.reply || body.read) {
    if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    markOwnerSeen();
    const t = threads.get(id);
    if (!t) return NextResponse.json({ error: "missing" }, { status: 404 });
    if (body.read) t.unread = false;
    const text = str(body.text, 1000);
    if (body.reply && text) t.messages.push({ from: "shop", text, at: Date.now() });
    return NextResponse.json({ ok: true });
  }

  const text = str(body.text, 1000);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const t = threads.get(id) ?? { id, name: "", messages: [], unread: false };
  t.name = str(body.name, 60) || t.name || "Customer";
  t.messages.push({ from: "customer", text, at: Date.now() });
  t.unread = true;
  threads.set(id, t);
  notifyOwner(`New chat from ${t.name}`, text, new URL(req.url).origin + "/admin");

  // Mechanic away: the assistant answers first. The reply is produced in the background so this request returns at once;
  // the customer's chat is polling every second while it waits.
  const away = ownerAway();
  if (away && !pending.has(id)) {
    pending.add(id);
    assistantReply(t.messages)
      .then((reply) => {
        t.messages.push({ from: "ai", text: reply, at: Date.now() });
      })
      .finally(() => pending.delete(id));
  }
  return NextResponse.json({ ok: true, away });
}
