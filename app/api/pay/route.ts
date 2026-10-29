import { NextResponse } from "next/server";
import { notifyOwner } from "@/lib/notify";
import { payStatusOf, walletAccounts } from "@/lib/payment";
import { store, withStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const cleanRef = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, "").toUpperCase() : "");

// Public: the shop's e-wallet numbers (shown to customers who choose e-wallet).
async function getWallets() {
  return NextResponse.json({ wallets: await walletAccounts() });
}

// Public: the customer reports an e-wallet payment. Adrian confirms it in the admin.
//   { kind: "advance", id, amount, wallet, ref }  a deposit sent right after booking (before the job)
//   { id, wallet, ref }                           payment of the receipt balance (after the job)
async function postPayment(req: Request) {
  const body = await req.json();
  const inq = store.inquiries.find((i) => i.id === body.id);
  if (!inq) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ref = cleanRef(body.ref);
  if (!/^[A-Z0-9-]{6,30}$/.test(ref)) return NextResponse.json({ error: "ref" }, { status: 400 });
  const wallet = typeof body.wallet === "string" ? body.wallet.slice(0, 20) : "";
  const origin = new URL(req.url).origin + "/admin";

  if (body.kind === "advance") {
    const amount = Math.round(Number(body.amount) * 100) / 100;
    if (inq.receipt || inq.status === "declined" || inq.status === "done") return NextResponse.json({ error: "closed" }, { status: 409 });
    if (inq.advance?.status === "confirmed") return NextResponse.json({ error: "already" }, { status: 409 });
    if (!(amount >= 1 && amount <= 100000)) return NextResponse.json({ error: "amount" }, { status: 400 });
    inq.advance = { amount, wallet, ref, status: "submitted", at: Date.now() };
    notifyOwner(`Deposit submitted: ${inq.name}`, `PHP ${amount.toLocaleString("en-PH")} via ${wallet || "e-wallet"}, ref ${ref}. Check your e-wallet, then confirm in the admin.`, origin);
    return NextResponse.json({ ok: true });
  }

  const r = inq.receipt;
  if (!r || r.payment !== "ewallet") return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (payStatusOf(r) === "paid") return NextResponse.json({ error: "already" }, { status: 409 });
  r.payRef = ref;
  r.wallet = wallet;
  r.payStatus = "submitted";
  const due = Math.max(0, r.total - (r.advance ?? 0));
  notifyOwner(`Payment submitted: ${inq.name}`, `${r.no} - PHP ${due.toLocaleString("en-PH")} via ${wallet || "e-wallet"}, ref ${ref}. Check your e-wallet, then confirm in the admin.`, origin);
  return NextResponse.json({ ok: true });
}

export const GET = getWallets;
export const POST = withStore(postPayment, { save: true });
