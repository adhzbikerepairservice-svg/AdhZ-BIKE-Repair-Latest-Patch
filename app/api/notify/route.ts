import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { emailConfigured } from "@/lib/mail";
import { alertAddress, sendAlertEmail } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Owner: how are alerts set up?
export async function GET(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const topic = process.env.NTFY_TOPIC ?? "";
  return NextResponse.json({ gmail: { configured: emailConfigured(), to: alertAddress() }, ntfy: { configured: !!topic, topic, web: topic ? `https://ntfy.sh/${topic}` : "", app: topic ? `ntfy://ntfy.sh/${topic}` : "" } });
}

// Owner: send a test alert through Gmail (and ntfy if set) and report what happened.
export async function POST(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const out: { gmail?: { ok: boolean; error?: string }; ntfy?: { ok: boolean; error?: string } } = {};
  out.gmail = await sendAlertEmail("Test alert", "If this reached your Gmail inbox, alerts for new bookings, chats and payments are working.");
  const topic = process.env.NTFY_TOPIC;
  if (topic) {
    try {
      const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: "POST", headers: { Title: "ADHZ test notification", Priority: "high" }, body: "ntfy test: alerts are working.", signal: AbortSignal.timeout(8000) });
      out.ntfy = { ok: res.ok };
    } catch {
      out.ntfy = { ok: false, error: "Could not reach ntfy" };
    }
  }
  return NextResponse.json(out);
}
