import { kvDel, kvGet, kvSet } from "./db";
import type { Inquiry } from "./shop";

/**
 * E-wallet payment flow (GCash / Maya style, manual verification):
 *  1. Customer picks "E-wallet" when booking (cash is paid in person).
 *  2. When the job is done, Adrian creates the receipt. Cash receipts are PAID at once; e-wallet receipts start UNPAID.
 *  3. The customer opens the receipt link, sends the exact amount to the shop's e-wallet number, and enters the
 *     reference number from their payment confirmation. The receipt becomes SUBMITTED and Adrian is notified.
 *  4. Adrian checks the money arrived in his e-wallet and taps "Confirm payment". The receipt becomes PAID.
 * Set the shop's numbers in .env.local: GCASH_NUMBER, GCASH_NAME, MAYA_NUMBER, MAYA_NAME (all optional).
 */
export type PayStatus = "unpaid" | "submitted" | "paid";

export type Wallet = { id: string; number: string; name: string; qr: boolean };

/** QR images shipped with the site (public/payment). Used when no QR was uploaded from the admin. */
export const STATIC_QR: Record<string, string> = { GCash: "/payment/qr-gcash.jpg" };
/** Shipped defaults for the number and name (public details, shown to customers), used when nothing else is set. */
const STATIC_WALLET: Record<string, { number: string; name: string }> = { GCash: { number: "09693333473", name: "Adrian S. Guese" } };

type Saved = Record<string, { number?: string; name?: string; qrType?: string; qrAt?: number }>;
const readSaved = async (): Promise<Saved> => (await kvGet<Saved>("pay_settings")) ?? {};
const qrKey = (id: string) => `pay_qr_${id.toLowerCase()}`;

const envOf = (id: string) => (id === "GCash" ? { number: process.env.GCASH_NUMBER, name: process.env.GCASH_NAME } : { number: process.env.MAYA_NUMBER, name: process.env.MAYA_NAME });

/** All settings for the admin form, including wallets that are not set up yet. Saved values win over .env.local, then shipped defaults. */
export const walletSettings = async () => {
  const saved = await readSaved();
  return ["GCash", "Maya"].map((id) => ({
    id,
    number: saved[id]?.number ?? envOf(id).number ?? STATIC_WALLET[id]?.number ?? "",
    name: saved[id]?.name ?? envOf(id).name ?? STATIC_WALLET[id]?.name ?? "",
    qr: !!saved[id]?.qrType || id in STATIC_QR,
    qrAt: saved[id]?.qrAt ?? 0,
  }));
};

/** The wallets customers can pay to. */
export const walletAccounts = async (): Promise<Wallet[]> =>
  (await walletSettings()).map(({ id, number, name, qr }) => ({ id, number, name, qr })).filter((w) => w.number || w.qr);

export async function saveWallet(id: string, patch: { number?: string; name?: string }, qr?: { type: string; bytes: Buffer }) {
  const saved = await readSaved();
  const cur = saved[id] ?? {};
  if (patch.number !== undefined) cur.number = patch.number;
  if (patch.name !== undefined) cur.name = patch.name;
  if (qr) {
    await kvSet(qrKey(id), { type: qr.type, data: qr.bytes.toString("base64") });
    cur.qrType = qr.type;
    cur.qrAt = Date.now();
  }
  saved[id] = cur;
  await kvSet("pay_settings", saved);
}

export async function removeQr(id: string) {
  const saved = await readSaved();
  if (saved[id]) {
    delete saved[id].qrType;
    delete saved[id].qrAt;
    await kvSet("pay_settings", saved);
  }
  await kvDel(qrKey(id));
}

export async function readQr(id: string): Promise<{ type: string; bytes: Buffer } | null> {
  const row = await kvGet<{ type: string; data: string }>(qrKey(id));
  return row ? { type: row.type, bytes: Buffer.from(row.data, "base64") } : null;
}

/** Receipts made before this flow existed have no status and count as paid. */
export const payStatusOf = (r: NonNullable<Inquiry["receipt"]>): PayStatus => r.payStatus ?? "paid";
