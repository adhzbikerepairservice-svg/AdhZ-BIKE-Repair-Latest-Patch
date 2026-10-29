import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { removeQr, saveWallet, walletSettings } from "@/lib/payment";

export const dynamic = "force-dynamic";

const OK_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Owner: read the e-wallet settings.
export async function GET(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ wallets: await walletSettings() });
}

// Owner: save a wallet's number, name and QR image (multipart form: wallet, number, name, qr, removeQr).
export async function POST(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await req.formData();
  const wallet = form.get("wallet") === "Maya" ? "Maya" : "GCash";
  const number = String(form.get("number") ?? "").replace(/[^\d+ ]/g, "").slice(0, 20);
  const name = String(form.get("name") ?? "").slice(0, 60);
  const file = form.get("qr");
  let qr: { type: string; bytes: Buffer } | undefined;
  if (file instanceof File && file.size > 0) {
    if (!OK_TYPES.includes(file.type)) return NextResponse.json({ error: "type" }, { status: 400 });
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "size" }, { status: 400 });
    qr = { type: file.type, bytes: Buffer.from(await file.arrayBuffer()) };
  }
  await saveWallet(wallet, { number, name }, qr);
  if (form.get("removeQr") === "1" && !qr) await removeQr(wallet);
  return NextResponse.json({ ok: true });
}
