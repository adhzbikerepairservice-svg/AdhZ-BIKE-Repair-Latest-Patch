import fs from "node:fs";
import path from "node:path";
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

const DIR = path.join(process.cwd(), "data", "payment");
const FILE = path.join(DIR, "settings.json");

type Saved = Record<string, { number?: string; name?: string; qrType?: string; qrAt?: number }>;
const readSaved = (): Saved => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
};

/** The wallets customers can pay to. Settings saved from the admin win over .env.local values. */
export const walletAccounts = (): Wallet[] => {
  const saved = readSaved();
  return [
    { id: "GCash", env: { number: process.env.GCASH_NUMBER, name: process.env.GCASH_NAME } },
    { id: "Maya", env: { number: process.env.MAYA_NUMBER, name: process.env.MAYA_NAME } },
  ]
    .map((w) => ({ id: w.id, number: saved[w.id]?.number ?? w.env.number ?? "", name: saved[w.id]?.name ?? w.env.name ?? "", qr: !!saved[w.id]?.qrType }))
    .filter((w) => w.number || w.qr);
};

/** All settings for the admin form, including wallets that are not set up yet. */
export const walletSettings = () => {
  const saved = readSaved();
  return ["GCash", "Maya"].map((id) => ({ id, number: saved[id]?.number ?? (id === "GCash" ? process.env.GCASH_NUMBER : process.env.MAYA_NUMBER) ?? "", name: saved[id]?.name ?? (id === "GCash" ? process.env.GCASH_NAME : process.env.MAYA_NAME) ?? "", qr: !!saved[id]?.qrType, qrAt: saved[id]?.qrAt ?? 0 }));
};

export function saveWallet(id: string, patch: { number?: string; name?: string }, qr?: { type: string; bytes: Buffer }) {
  fs.mkdirSync(DIR, { recursive: true });
  const saved = readSaved();
  const cur = saved[id] ?? {};
  if (patch.number !== undefined) cur.number = patch.number;
  if (patch.name !== undefined) cur.name = patch.name;
  if (qr) {
    fs.writeFileSync(path.join(DIR, `qr-${id.toLowerCase()}.bin`), qr.bytes);
    cur.qrType = qr.type;
    cur.qrAt = Date.now();
  }
  saved[id] = cur;
  fs.writeFileSync(FILE, JSON.stringify(saved, null, 2));
}

export function removeQr(id: string) {
  const saved = readSaved();
  if (saved[id]) {
    delete saved[id].qrType;
    delete saved[id].qrAt;
    fs.writeFileSync(FILE, JSON.stringify(saved, null, 2));
  }
  try {
    fs.unlinkSync(path.join(DIR, `qr-${id.toLowerCase()}.bin`));
  } catch {
    /* none saved */
  }
}

export function readQr(id: string): { type: string; bytes: Buffer } | null {
  const type = readSaved()[id]?.qrType;
  if (!type) return null;
  try {
    return { type, bytes: fs.readFileSync(path.join(DIR, `qr-${id.toLowerCase()}.bin`)) };
  } catch {
    return null;
  }
}

/** Receipts made before this flow existed have no status and count as paid. */
export const payStatusOf = (r: NonNullable<Inquiry["receipt"]>): PayStatus => r.payStatus ?? "paid";
