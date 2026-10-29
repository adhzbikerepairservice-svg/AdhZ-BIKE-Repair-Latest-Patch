import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";
import { getService as svcOf } from "@/lib/shop";
import { notifyOwner } from "@/lib/notify";
import { store } from "@/lib/store";
import { getMech, getService, HOURS, Inquiry, NewInquiry, slotId } from "@/lib/shop";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Owner: full queue.
export async function GET(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ inquiries: [...store.inquiries].sort((a, b) => b.createdAt - a.createdAt) });
}

// Public: send an inquiry; holds the slot as pending.
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewInquiry>;
  const name = str(body.name, 100);
  const contact = str(body.contact, 150);
  const email = str(body.email, 150).toLowerCase();
  if (!/^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });
  const date = str(body.date, 10);
  const hour = body.hour as number;
  if (!name || !contact || !getService(str(body.service, 30)) || !getMech(str(body.mech, 30)) || !HOURS.includes(hour) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const mech = str(body.mech, 30);
  const id = slotId(date, mech, hour);
  if (store.slots.has(id)) return NextResponse.json({ error: "taken" }, { status: 409 });

  const inquiry: Inquiry = {
    id: crypto.randomUUID(),
    name,
    contact,
    email,
    payPref: body.payPref === "ewallet" ? "ewallet" : "cash",
    payNow: body.payPref === "ewallet" && body.payNow === true,
    service: str(body.service, 30),
    bike: str(body.bike, 40),
    brand: str(body.brand, 100),
    notes: str(body.notes, 1000),
    handover: body.handover === "collect" ? "collect" : "bring",
    address: body.handover === "collect" ? str(body.address, 200) : "",
    pickup: /^\d{4}-\d{2}-\d{2}$/.test(str(body.pickup, 10)) ? str(body.pickup, 10) : "",
    date,
    mech,
    hour,
    slot: id,
    status: "pending",
    createdAt: Date.now(),
  };
  store.slots.set(id, { date, mech, hour, status: "pending" });
  store.inquiries.push(inquiry);
  notifyOwner(`New booking: ${name}`, `${getService(inquiry.service)?.name} on ${date} at ${hour}:00. Contact: ${contact}`, new URL(req.url).origin + "/admin");
  return NextResponse.json({ ok: true, id: inquiry.id });
}

/** Emails the receipt to the customer and records whether it worked. */
async function emailReceipt(inq: Inquiry, origin: string) {
  const r = inq.receipt!;
  const link = origin + "/receipt/" + inq.id;
  const rows = r.lines.map((l) => `<tr><td style="padding:6px 0">${l.label.replace(/</g, "&lt;")}</td><td style="padding:6px 0;text-align:right">₱${l.amount.toLocaleString("en-PH")}</td></tr>`).join("");
  const due = r.payStatus === "unpaid";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;color:#1e2b52"><h2 style="color:#1f52c4;margin:0 0 4px">ADHZ Bike Repair &amp; Service</h2><p style="margin:0 0 16px;color:#5b6688">Receipt ${r.no}</p><p>Hi ${inq.name.replace(/</g, "&lt;")}, your ${svcOf(inq.service)?.name?.toLowerCase() ?? "service"} is done. Thank you!</p><p style="margin:0 0 8px;color:#5b6688">Paid by: <b>${r.payment === "ewallet" ? "E-wallet" + (r.payRef ? " (ref " + r.payRef.replace(/</g, "&lt;") + ")" : "") : "Cash"}</b></p><table style="width:100%;border-collapse:collapse;border-top:1px solid #d5dcf0">${rows}<tr><td style="padding:10px 0;border-top:1px solid #d5dcf0"><b>Total</b></td><td style="padding:10px 0;border-top:1px solid #d5dcf0;text-align:right"><b>₱${r.total.toLocaleString("en-PH")}</b></td></tr></table>${r.note ? `<p style="color:#5b6688">${r.note.replace(/</g, "&lt;")}</p>` : ""}${due ? `<p style="background:#fbefc2;padding:10px;border-radius:8px">Payment due: open the receipt below to pay by e-wallet and enter your reference number.</p>` : ""}<p><a href="${link}" style="background:#1f52c4;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${due ? "Open receipt and pay" : "Open full receipt"}</a></p><p style="color:#5b6688;font-size:13px">Brgy. Camacho Cadre, Balanga City, Bataan · 0969 333 3473</p></div>`;
  const sent = await sendEmail(inq.email, `Your receipt from ADHZ Bike Repair & Service (${r.no})`, html);
  r.emailed = sent.ok;
  r.emailError = sent.ok ? undefined : sent.error;
  return sent;
}

// Owner: confirm, decline, or mark done (creates the receipt and emails it when email is configured).
export async function PATCH(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, action } = body;
  const inq = store.inquiries.find((i) => i.id === id);
  if (inq && action === "confirmadvance" && inq.advance) {
    inq.advance.status = "confirmed";
    return NextResponse.json({ ok: true });
  }
  if (inq && action === "markpaid" && inq.receipt) {
    inq.receipt.payStatus = "paid";
    return NextResponse.json({ ok: true });
  }
  if (inq && action === "resend" && inq.receipt) {
    const sent = await emailReceipt(inq, new URL(req.url).origin);
    return NextResponse.json({ ok: true, emailed: sent.ok, error: sent.error });
  }
  if (!inq || !["confirm", "decline", "done"].includes(action)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (action === "confirm") {
    inq.status = "confirmed";
    store.slots.set(inq.slot, { date: inq.date, mech: inq.mech, hour: inq.hour, status: "confirmed" });
  } else if (action === "decline") {
    inq.status = "declined";
    store.slots.delete(inq.slot);
  } else {
    const lines = (Array.isArray(body.lines) ? body.lines : [])
      .map((l: { label?: unknown; amount?: unknown }) => ({ label: str(l.label, 80), amount: Math.max(0, Number(l.amount) || 0) }))
      .filter((l: { label: string; amount: number }) => l.label && l.amount >= 0)
      .slice(0, 20);
    if (!lines.length) return NextResponse.json({ error: "lines" }, { status: 400 });
    const total = lines.reduce((n: number, l: { amount: number }) => n + l.amount, 0);
    const no = "ADHZ-" + new Date().getFullYear() + "-" + String(store.inquiries.filter((i) => i.receipt).length + 1).padStart(4, "0");
    inq.status = "done";
    const ew = body.payment === "ewallet";
    const advance = inq.advance?.status === "confirmed" ? Math.min(inq.advance.amount, total) : 0;
    const balance = total - advance;
    const refund = inq.advance?.status === "confirmed" ? Math.max(0, Math.round((inq.advance.amount - total) * 100) / 100) : 0; // deposit bigger than the bill
    const ref = ew ? str(body.payRef, 40) : "";
    // cash is collected in person; an e-wallet receipt is paid at once only if Adrian already has the reference
    inq.receipt = { no, lines, total, advance, refund, note: str(body.note, 300), payment: ew ? "ewallet" : "cash", payRef: ref, payStatus: !ew || ref || balance <= 0 ? "paid" : "unpaid", doneAt: Date.now(), emailed: false };
    const sent = await emailReceipt(inq, new URL(req.url).origin);
    return NextResponse.json({ ok: true, no, refund: inq.receipt.refund ?? 0, emailed: sent.ok, error: sent.error, link: new URL(req.url).origin + "/receipt/" + inq.id });
  }
  return NextResponse.json({ ok: true });
}
