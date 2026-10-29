"use client";

import { useCallback, useEffect, useState } from "react";
import { dayLong, hourLabel, HOURS, Slot, ymd } from "@/lib/shop";

/** Owner tool: block or reopen a whole day, a range of days, or only certain hours. Booked slots are never touched. */
export default function BlockTimes({ headers }: { headers?: Record<string, string> }) {
  const today = ymd(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [whole, setWhole] = useState(true);
  const [hours, setHours] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ text: string; kind: "good" | "err" } | null>(null);
  const [blocks, setBlocks] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (res.ok) {
        const data: { slots: [string, Slot][] } = await res.json();
        setBlocks(data.slots.map(([, s]) => s).filter((s) => s.status === "blocked"));
      }
    } catch {
      /* keep the last list */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: "block" | "release", range = { from, to }, hrs: number[] = whole ? [] : hours) {
    if (!whole && !hrs.length && action === "block") return setMsg({ text: "Pick at least one hour, or choose Whole day.", kind: "err" });
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/slots", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action, ...range, hours: hrs }) });
    setBusy(false);
    if (!res.ok) return setMsg({ text: "Could not save. Please sign in again.", kind: "err" });
    const r = await res.json();
    const verb = action === "block" ? "Blocked" : "Reopened";
    setMsg({
      text: `${verb} ${r.changed} slot${r.changed === 1 ? "" : "s"}.${r.skipped ? ` ${r.skipped} already booked, left as they are.` : ""}`,
      kind: r.changed || !r.skipped ? "good" : "err",
    });
    load();
  }

  // blocked slots grouped by day for the "currently blocked" list
  const byDay = new Map<string, number[]>();
  for (const b of blocks) byDay.set(b.date, [...(byDay.get(b.date) ?? []), b.hour]);
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="blockgrid">
      <div className="panel">
        <h3>Block or reopen times</h3>
        <p className="note">Customers can&apos;t book blocked times. Slots that are already booked are never changed.</p>

        <div className="row2">
          <label htmlFor="bFrom">
            From
            <input
              id="bFrom"
              type="date"
              min={today}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (to < e.target.value) setTo(e.target.value);
              }}
            />
          </label>
          <label htmlFor="bTo">
            Until
            <input id="bTo" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <fieldset className="handover">
          <legend>Which times?</legend>
          <div className="seg" role="radiogroup">
            <button type="button" role="radio" aria-checked={whole} onClick={() => setWhole(true)}>
              <b>Whole day</b>
              <small>All working hours (day off, holiday)</small>
            </button>
            <button type="button" role="radio" aria-checked={!whole} onClick={() => setWhole(false)}>
              <b>Only some hours</b>
              <small>Pick the hours below</small>
            </button>
          </div>
        </fieldset>

        {!whole && (
          <div className="hourpick" role="group" aria-label="Hours">
            {HOURS.map((h) => (
              <button key={h} type="button" aria-pressed={hours.includes(h)} onClick={() => setHours((cur) => (cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h]))}>
                {hourLabel(h)}
              </button>
            ))}
          </div>
        )}

        {msg && <div role="status" className={`msg ${msg.kind === "good" ? "good" : "err"}`}>{msg.text}</div>}

        <div className="wizbtns">
          <button type="button" className="btn" disabled={busy} onClick={() => run("block")}>
            Block {whole ? "the whole day" : "these hours"}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => run("release")}>
            Reopen
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Currently blocked</h3>
        {days.length === 0 ? (
          <p className="note">Nothing is blocked. Customers can book every working hour.</p>
        ) : (
          <ul className="blocklist">
            {days.map(([date, hrs]) => {
              const all = hrs.length >= HOURS.length;
              return (
                <li key={date}>
                  <span>
                    <b>{dayLong(date)}</b>
                    <small>{all ? "Whole day" : hrs.sort((a, b) => a - b).map(hourLabel).join(", ")}</small>
                  </span>
                  <button type="button" className="btn ghost" onClick={() => run("release", { from: date, to: date }, [])}>
                    Reopen
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
