"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type W = { id: string; number: string; name: string; qr: boolean; qrAt: number };

function Wallet({ w, headers, onSaved }: { w: W; headers?: Record<string, string>; onSaved: () => void }) {
  const [number, setNumber] = useState(w.number);
  const [name, setName] = useState(w.name);
  const [preview, setPreview] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = number !== w.number || name !== w.name || !!preview;
  const ready = !!w.number && w.qr;
  const current = preview || (w.qr ? `/api/pay/qr/${w.id}?v=${w.qrAt}` : "");

  function pick(file?: File) {
    setNote(null);
    setFileName(file?.name ?? "");
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setNote(null);
    setBusy(true);
    try {
      const res = await fetch("/api/pay/settings", { method: "POST", headers, body: new FormData(form) });
      if (res.ok) {
        pick();
        (form.elements.namedItem("qr") as HTMLInputElement).value = "";
        setNote({ ok: true, text: "Saved" });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setNote(null), 2500);
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        setNote({ ok: false, text: d.error === "type" ? "The QR must be a PNG, JPG or WebP image." : d.error === "size" ? "That image is too big (limit 3 MB)." : "Could not save. Please sign in again." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel wallet" onSubmit={save}>
      <input type="hidden" name="wallet" value={w.id} />
      <div className="wallet-head">
        <h3>{w.id}</h3>
        <span className={`wallet-pill${ready ? " on" : ""}`}>{ready ? "Ready" : w.number || w.qr ? "Almost" : "Not set up"}</span>
      </div>
      <div className="row2">
        <label>
          Number
          <input name="number" value={number} onChange={(e) => { setNumber(e.target.value); setNote(null); }} inputMode="tel" placeholder="09xx xxx xxxx" />
        </label>
        <label>
          Account name
          <input name="name" value={name} onChange={(e) => { setName(e.target.value); setNote(null); }} placeholder="Adrian S. Guese" />
        </label>
      </div>
      <div className="qrpick">
        <div className="qrpick-box">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt={`${w.id} QR code`} />
          ) : (
            <span>No QR yet</span>
          )}
        </div>
        <div className="qrpick-side">
          <label className="btn ghost qrpick-btn">
            {w.qr || preview ? "Change QR" : "Upload QR"}
            <input name="qr" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          <small>{fileName || "PNG, JPG or WebP, up to 3 MB"}</small>
          {w.qr && !preview && (
            <label className="check">
              <input type="checkbox" name="removeQr" value="1" /> Remove QR
            </label>
          )}
        </div>
      </div>
      <div className="wallet-foot">
        <span role="status" className={`wallet-note${note ? (note.ok ? " good" : " bad") : ""}`}>{note?.text}</span>
        <button className="btn" type="submit" disabled={busy || (!dirty && !w.qr)}>
          {busy ? "Saving…" : dirty ? `Save ${w.id}` : "Up to date"}
        </button>
      </div>
    </form>
  );
}

/** Admin: set up the shop's GCash / Maya number, account name and QR code image. */
export default function PaymentSettings({ headers }: { headers?: Record<string, string> }) {
  const [wallets, setWallets] = useState<W[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/pay/settings", { cache: "no-store", headers });
    if (res.ok) setWallets((await res.json()).wallets);
  }, [headers]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="paysettings">
      {wallets.map((w) => (
        <Wallet key={w.id} w={w} headers={headers} onSaved={load} />
      ))}
    </div>
  );
}
