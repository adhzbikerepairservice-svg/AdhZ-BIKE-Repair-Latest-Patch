"use client";

import { useEffect, useState } from "react";

type Info = { gmail: { configured: boolean; to: string }; ntfy: { configured: boolean; topic: string; web: string; app: string } };

/** Admin: phone alerts through the shop Gmail (and optionally the ntfy app). */
export default function AlertSettings({ headers }: { headers?: Record<string, string> }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/notify", { cache: "no-store", headers }).then((r) => r.json()).then(setInfo).catch(() => {});
  }, [headers]);

  async function test() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/notify", { method: "POST", headers });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    const parts: string[] = [];
    let ok = false;
    if (d.gmail) {
      parts.push(d.gmail.ok ? `Gmail alert sent to ${info?.gmail.to}.` : `Gmail: ${d.gmail.error ?? "not sent"}`);
      ok = ok || d.gmail.ok;
    }
    if (d.ntfy) {
      parts.push(d.ntfy.ok ? "ntfy alert sent." : `ntfy: ${d.ntfy.error ?? "not sent"}`);
      ok = ok || d.ntfy.ok;
    }
    setMsg({ text: parts.join(" ") || "Could not send.", ok });
  }

  if (!info) return <p className="note">Loading...</p>;

  return (
    <div className="panel alertbox">
      <h3>Phone alerts through Gmail</h3>
      <p>
        Every new booking, customer chat message, deposit and e-wallet payment is emailed to <b>{info.gmail.to || "your shop Gmail"}</b>. With that Gmail account signed in on your phone, each one shows up as a normal Gmail notification.
      </p>
      {!info.gmail.configured && (
        <div className="msg err">
          Gmail is not connected yet. Add <code>GMAIL_APP_PASSWORD</code> (the 16-character Google app password) to <code>.env.local</code> and restart the server.
        </div>
      )}
      <ol>
        <li>On your phone, open the Gmail app and sign in to <b>{info.gmail.to || "the shop Gmail"}</b>.</li>
        <li>In Gmail, open Settings, then that account, and turn Notifications on (all new mail, or high priority).</li>
        <li>Tap <b>Send test alert</b> below and check your phone.</li>
      </ol>
      <div className="wizbtns">
        <button type="button" className="btn" disabled={busy} onClick={test}>{busy ? "Sending..." : "Send test alert"}</button>
      </div>
      {msg && <div role="status" className={`msg ${msg.ok ? "good" : "err"}`}>{msg.text}</div>}
      {info.ntfy.configured && (
        <p className="note">
          Backup: the ntfy app is also set up (topic <code>{info.ntfy.topic}</code>) and gets the same alerts.
        </p>
      )}
    </div>
  );
}
