"use client";

import { useCallback, useEffect, useState } from "react";

type W = { id: string; number: string; name: string; qr: boolean; qrAt: number };

/** Admin: set up the shop's GCash / Maya number, account name and QR code image. */
export default function PaymentSettings({ headers }: { headers?: Record<string, string> }) {
  const [wallets, setWallets] = useState<W[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/pay/settings", { cache: "no-store", headers });
    if (res.ok) setWallets((await res.json()).wallets);
  }, [headers]);
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/pay/settings", { method: "POST", headers, body: new FormData(e.currentTarget) });
    if (res.ok) {
      setMsg(`${id} saved. Customers now see it.`);
      (e.currentTarget.elements.namedItem("qr") as HTMLInputElement).value = "";
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error === "type" ? "The QR must be a PNG, JPG or WebP image." : d.error === "size" ? "That image is too big (limit 3 MB)." : "Could not save. Please sign in again.");
    }
  }

  return (
    <div className="paysettings">
      {msg && <div role="status" className="msg good">{msg}</div>}
      {wallets.map((w) => (
        <form key={w.id} className="panel" onSubmit={(e) => save(e, w.id)}>
          <input type="hidden" name="wallet" value={w.id} />
          <h3>{w.id}</h3>
          <div className="row2">
            <label>
              {w.id} number
              <input name="number" defaultValue={w.number} inputMode="tel" placeholder="09xx xxx xxxx" />
            </label>
            <label>
              Account name
              <input name="name" defaultValue={w.name} placeholder="Adrian S. Guese" />
            </label>
          </div>
          <label>
            QR code image
            <input name="qr" type="file" accept="image/png,image/jpeg,image/webp" />
          </label>
          {w.qr && (
            <div className="qrbox">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qrimg big" src={`/api/pay/qr/${w.id}?v=${w.qrAt}`} alt={`Current ${w.id} QR code`} />
              <label className="check">
                <input type="checkbox" name="removeQr" value="1" /> Remove this QR code
              </label>
            </div>
          )}
          <p className="note">Customers see the QR code (and the number, if you enter one) when they choose e-wallet and on their receipt.</p>
          <button className="btn" type="submit">Save {w.id}</button>
        </form>
      ))}
    </div>
  );
}
