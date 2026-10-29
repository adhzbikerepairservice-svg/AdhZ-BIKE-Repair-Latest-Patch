"use client";

import { useState } from "react";

interface Props {
  id: string;
  total: number;
  status: "unpaid" | "submitted";
  wallets: { id: string; number: string; name: string; qr: boolean }[];
  shopPhone: string;
  initialRef: string;
}

/** Customer-side e-wallet step on the receipt: where to send the money, then report the reference number. */
export default function PayPanel({ id, total, status, wallets, shopPhone, initialRef }: Props) {
  const [wallet, setWallet] = useState(wallets[0]?.id ?? "GCash");
  const [ref, setRef] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "err">(status === "submitted" ? "sent" : "idle");
  const [shownRef, setShownRef] = useState(initialRef);
  const acct = wallets.find((w) => w.id === wallet);
  const money = "₱" + total.toLocaleString("en-PH", { minimumFractionDigits: 2 });

  async function submit() {
    setState("busy");
    const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, wallet, ref }) });
    if (res.ok) {
      setShownRef(ref.trim().toUpperCase());
      setState("sent");
    } else setState("err");
  }

  if (state === "sent") {
    return (
      <div className="paypanel sent noprint" role="status">
        <b>Payment submitted</b>
        <p>Reference {shownRef}. Adrian will confirm it shortly and this receipt will turn to PAID.</p>
      </div>
    );
  }

  return (
    <div className="paypanel noprint">
      <h3>Pay by e-wallet</h3>
      <ol>
        <li>
          Send exactly <b>{money}</b>{" "}
          {wallets.length > 0 ? (
            <>
              to {wallets.length > 1 && (
                <span className="walletpick" role="radiogroup" aria-label="E-wallet">
                  {wallets.map((w) => (
                    <button key={w.id} type="button" role="radio" aria-checked={wallet === w.id} onClick={() => setWallet(w.id)}>
                      {w.id}
                    </button>
                  ))}
                </span>
              )}
              {acct?.number ? <b>{acct.number}</b> : <b>{acct?.id} (scan the QR code below)</b>}
              {acct?.name ? <> ({acct.name})</> : null}
            </>
          ) : (
            <>to the shop&apos;s GCash or Maya. Ask for the number: <a href={`tel:${shopPhone}`}>{shopPhone}</a></>
          )}
          .
        </li>
        <li>Copy the <b>reference number</b> from your payment confirmation.</li>
        <li>Enter it below and tap &ldquo;I have paid&rdquo;.</li>
      </ol>
      {acct?.qr && (
        <div className="qrbox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="qrimg big" src={`/api/pay/qr/${acct.id}`} alt={`${acct.id} QR code of the shop`} />
          <small>Open {acct.id}, tap Scan QR, and enter {money}</small>
        </div>
      )}
      <div className="payrow">
        <input aria-label="Reference number" placeholder="Reference number" value={ref} onChange={(e) => setRef(e.target.value)} autoComplete="off" />
        <button type="button" className="btn" disabled={state === "busy" || ref.trim().length < 6} onClick={submit}>
          {state === "busy" ? "Sending..." : "I have paid"}
        </button>
      </div>
      {state === "err" && <p className="note chaterr">Could not send. Check the reference number (letters and numbers, at least 6 characters) and try again.</p>}
    </div>
  );
}
