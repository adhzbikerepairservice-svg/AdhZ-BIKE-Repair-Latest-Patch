"use client";

import { FormEvent, useEffect, useState } from "react";
import { dayLong, getMech, getService, hourLabel, NewInquiry } from "@/lib/shop";
import type { Pick } from "./Schedule";

interface Props {
  sel: Pick | null;
  service: string;
  onSent: () => void;
  onTaken: () => void;
  onAnother: () => void;
}

const BIKES = ["Road", "Mountain", "Hybrid / city", "Folding", "E-bike", "BMX / kids", "Other"];

export default function InquiryForm({ sel, service, onSent, onTaken, onAnother }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [bike, setBike] = useState(BIKES[0]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [handover, setHandover] = useState<"bring" | "collect">("bring");
  const [address, setAddress] = useState("");
  const [pickup, setPickup] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [wallets, setWallets] = useState<{ id: string; number: string; name: string; qr: boolean }[]>([]);
  const [copied, setCopied] = useState("");
  const [payPref, setPayPref] = useState<"cash" | "ewallet">("cash");
  const [msg, setMsg] = useState<{ text: string; kind: "err" | "good" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState("");
  const [done, setDone] = useState<{ ref: string; text: string; ics: string; wa: string; id: string; deposit: boolean } | null>(null);
  const [dep, setDep] = useState({ wallet: "", amount: "", ref: "", state: "idle" as "idle" | "busy" | "sent" | "err" });

  function fail(id: string, text: string) {
    setBad(id);
    setMsg({ text, kind: "err" });
    document.getElementById(id)?.focus();
  }

  // the shop's e-wallet numbers, fetched when the customer picks e-wallet
  useEffect(() => {
    if (payPref !== "ewallet" || wallets.length) return;
    fetch("/api/pay").then((r) => r.json()).then((d) => setWallets(d.wallets ?? [])).catch(() => {});
  }, [payPref, wallets.length]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(""), 1800);
    }).catch(() => {});
  };

  async function sendDeposit() {
    if (!done) return;
    setDep((d) => ({ ...d, state: "busy" }));
    const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "advance", id: done.id, amount: Number(dep.amount), wallet: dep.wallet || wallets[0]?.id || "", ref: dep.ref }) });
    setDep((d) => ({ ...d, state: res.ok ? "sent" : "err" }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBad("");
    if (!service) return fail("fService", "Choose the service you need in step 1.");
    if (!name.trim()) return fail("fName", "Enter your name.");
    if (!contact.trim()) return fail("fContact", "Enter a phone number so we can reach you.");
    if (!/^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(email.trim())) return fail("fEmail", "Enter your Gmail address (ending in @gmail.com). We send your receipt there.");
    if (handover === "collect" && !address.trim()) return fail("fAddress", "Enter the address where we should collect the bike.");
    if (!sel) return setMsg({ text: "Pick a free time slot from the schedule first.", kind: "err" });

    setBusy(true);
    setMsg(null);
    const payload: NewInquiry = { name, contact, email, service, bike, brand, notes, handover, address, pickup, payPref, payNow: payPref === "ewallet" && payNow, ...sel };
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        setMsg({ text: "That slot was just taken. Please pick another time.", kind: "err" });
        onTaken();
        return;
      }
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      const ref = "ADHZ-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const d = sel.date.replace(/-/g, "");
      const p2 = (n: number) => String(n).padStart(2, "0");
      const ics = "data:text/calendar;charset=utf-8," + encodeURIComponent(["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${d}T${p2(sel.hour)}0000`, `DTEND:${d}T${p2(sel.hour + 1)}0000`, `SUMMARY:Bike visit at ADHZ (${getService(service)?.name ?? "service"})`, "LOCATION:Brgy. Camacho Cadre\\, Balanga City\\, Bataan", `DESCRIPTION:Reference ${ref}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"));
      const msgText = `Hi Adrian, this is ${name}. I booked ${getService(service)?.name ?? "a visit"} for ${dayLong(sel.date)} at ${hourLabel(sel.hour)} (ref ${ref}).`;
      const wa = `https://wa.me/639693333473?text=${encodeURIComponent(msgText)}`;
      setDone({
        ics,
        wa,
        ref,
        id: created.id,
        deposit: payPref === "ewallet" && payNow,
        text: `${getMech(sel.mech)?.name} is held for ${dayLong(sel.date)} at ${hourLabel(sel.hour)}. The shop will confirm by ${contact}.`,
      });
      setNotes("");
      setPickup("");
      setAddress("");
      onSent();
    } catch {
      setMsg({ text: "Could not send the inquiry. Check your connection and try again.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  const detailsOk = name.trim().length > 1 && contact.trim().length >= 7 && /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(email.trim());
  const stepsDone = (service ? 1 : 0) + (sel ? 1 : 0) + (detailsOk ? 1 : 0);
  const svcName = getService(service)?.name;
  const when = sel ? `${dayLong(sel.date)} at ${hourLabel(sel.hour)}` : "";

  return (
    <div className="panel sticky">
      {done ? (
        <div className="done" role="status">
          <span className="check" aria-hidden>
            &#10003;
          </span>
          <h3>Inquiry sent</h3>
          <span className="ref">{done.ref}</span>
          <p className="note">{done.text}</p>
          {done.deposit && (
            <div className="deposit">
              {dep.state === "sent" ? (
                <p className="msg good">Deposit submitted. Adrian will confirm it, and it will be deducted from your final bill.</p>
              ) : (
                <>
                  <b>Send your deposit</b>
                  <p className="note">
                    Send any amount you like (for example half) to {wallets.length ? wallets.map((w) => `${w.id}${w.number ? " " + w.number : " (scan the QR code)"}${w.name ? " (" + w.name + ")" : ""}`).join(" or ") : "the shop's GCash or Maya (ask on WhatsApp)"}, then enter the reference number.
                  </p>
                  {wallets.length > 1 && (
                    <span className="walletpick" role="radiogroup" aria-label="E-wallet">
                      {wallets.map((w) => (
                        <button key={w.id} type="button" role="radio" aria-checked={(dep.wallet || wallets[0].id) === w.id} onClick={() => setDep((d) => ({ ...d, wallet: w.id }))}>
                          {w.id}
                        </button>
                      ))}
                    </span>
                  )}
                  <div className="row2">
                    <input aria-label="Amount sent in pesos" type="number" min="1" inputMode="decimal" placeholder="Amount (PHP)" value={dep.amount} onChange={(e) => setDep((d) => ({ ...d, amount: e.target.value }))} />
                    <input aria-label="Reference number" placeholder="Reference number" value={dep.ref} onChange={(e) => setDep((d) => ({ ...d, ref: e.target.value }))} autoComplete="off" />
                  </div>
                  <button type="button" className="btn" disabled={dep.state === "busy" || !(Number(dep.amount) >= 1) || dep.ref.replace(/\s/g, "").length < 6} onClick={sendDeposit}>
                    {dep.state === "busy" ? "Sending..." : "I have sent the deposit"}
                  </button>
                  {dep.state === "err" && <p className="note chaterr">Could not send. Check the amount and the reference number (at least 6 letters or digits).</p>}
                </>
              )}
            </div>
          )}
          <div className="done-actions">
            <a className="btn" href={done.ics} download="adhz-visit.ics">Add to calendar</a>
            <a className="btn outline" href={done.wa} target="_blank" rel="noreferrer">Message on WhatsApp</a>
          </div>
          <button type="button" className="btn ghost" onClick={() => { setDone(null); onAnother(); }}>
            Send another inquiry
          </button>
        </div>
      ) : (
      <>
      <h3 className="steph">
        <span className="step">3</span>Your details
      </h3>
      <form id="bookform" onSubmit={submit} noValidate>
        <div className="ticket" aria-label="Your visit so far">
          <div className="ticket-head">
            <span>Your visit</span>
            <b>{stepsDone} of 3 done</b>
          </div>
          <div className="ticket-bar" aria-hidden>
            <i style={{ width: `${(stepsDone / 3) * 100}%` }} />
          </div>
          <ul>
            <li className={service ? "ok" : ""}>
              <span className="dotc" aria-hidden />
              <small>Service</small>
              <b>{svcName ?? "Pick a service on the left"}</b>
            </li>
            <li className={sel ? "ok" : ""}>
              <span className="dotc" aria-hidden />
              <small>When</small>
              <b>{sel ? when : "Pick a free time on the left"}</b>
            </li>
            <li className={sel ? "ok" : ""}>
              <span className="dotc" aria-hidden />
              <small>Mechanic</small>
              <b>{sel ? getMech(sel.mech)?.name : "Chosen with the time"}</b>
            </li>
            <li className={detailsOk ? "ok" : ""}>
              <span className="dotc" aria-hidden />
              <small>Your details</small>
              <b>{detailsOk ? "Name, phone and Gmail added" : "Fill in the form below"}</b>
            </li>
          </ul>
        </div>
        <div className="formcard" id="fDetails">
        <h4 className="fhead">About you</h4>
        <div className="row2">
          <label htmlFor="fName">
            Your name
            <input id="fName" autoComplete="name" value={name} aria-invalid={bad === "fName"} onChange={(e) => { setBad(""); setName(e.target.value); }} required />
          </label>
          <label htmlFor="fContact">
            Phone number
            <input id="fContact" autoComplete="tel" inputMode="tel" placeholder="0917 123 4567" value={contact} aria-invalid={bad === "fContact"} onChange={(e) => { setBad(""); setContact(e.target.value); }} required />
          </label>
        </div>
        <label htmlFor="fEmail">
          Gmail (for your receipt)
          <input id="fEmail" type="email" inputMode="email" autoComplete="email" pattern="[A-Za-z0-9._%+-]+@(gmail|googlemail).com" title="A Gmail address, like name@gmail.com" placeholder="yourname@gmail.com" value={email} aria-invalid={bad === "fEmail"} onChange={(e) => { setBad(""); setEmail(e.target.value); }} required />
        </label>
        <h4 className="fhead">Your bike</h4>
        <div className="row2">
          <label htmlFor="fBike">
            Bike type
            <select id="fBike" value={bike} onChange={(e) => setBike(e.target.value)}>
              {BIKES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label htmlFor="fBrand">
            Brand / model
            <input id="fBrand" placeholder="optional" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
        </div>
        <h4 className="fhead">Anything else?</h4>
        <label htmlFor="fNotes">
          What is going on with the bike? (optional)
          <textarea
            id="fNotes"
            placeholder="Noises, flat tires, parts you want for a build, how often you ride..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        </div>
        <div className="formcard" id="fPay">
          <h3 className="steph">
            <span className="step">4</span>Pick-up and payment
          </h3>
          <h4 className="fhead first">Drop-off and pick-up</h4>
                <fieldset className="handover">
          <div className="seg" role="radiogroup">
            <button type="button" role="radio" aria-checked={handover === "bring"} onClick={() => setHandover("bring")}>
              <b>I&apos;ll bring it myself</b>
              <small>Drop it at the shop and pick it up when it&apos;s done. No extra fee.</small>
            </button>
            <button type="button" role="radio" aria-checked={handover === "collect"} onClick={() => setHandover("collect")}>
              <b>Pick up and deliver</b>
              <small>We collect it from your home and bring it back. Extra fee applies.</small>
            </button>
          </div>
        </fieldset>
        {handover === "collect" && (
          <>
            <label htmlFor="fAddress">
              Your address for pick-up and delivery
              <input id="fAddress" value={address} aria-invalid={bad === "fAddress"} placeholder="House no., street, barangay, landmark" onChange={(e) => { setBad(""); setAddress(e.target.value); }} />
            </label>
            <p className="msg fee">The delivery fee depends on how far you are. We&apos;ll tell you the amount by phone before we come.</p>
          </>
        )}
        <label htmlFor="fPickup">
          {handover === "collect" ? "Which day should we deliver it back? (optional)" : "Which day will you pick it up? (optional)"}
          <input id="fPickup" type="date" value={pickup} min={sel ? sel.date : undefined} onChange={(e) => setPickup(e.target.value)} />
          <span className="note">Leave it blank and we&apos;ll call you when the bike is ready.</span>
        </label>
        <h4 className="fhead">Mode of payment</h4>
        <fieldset className="handover">
          <div className="seg" role="radiogroup">
            <button type="button" role="radio" aria-checked={payPref === "cash"} onClick={() => setPayPref("cash")}>
              <b>Cash</b>
              <small>Pay when the job is done</small>
            </button>
            <button type="button" role="radio" aria-checked={payPref === "ewallet"} onClick={() => setPayPref("ewallet")}>
              <b>E-wallet</b>
              <small>GCash, Maya and others</small>
            </button>
          </div>
        </fieldset>
        {payPref === "ewallet" && (
          <div className="ewallet-info">
            <b>How e-wallet payment works</b>
            <ol>
              <li>The exact amount is only known once the job is done, so your receipt (emailed to you) shows it.</li>
              <li>You then send it to the shop&apos;s {wallets.length ? wallets.map((w) => w.id).join(" or ") : "GCash or Maya"} and enter the reference number on the receipt.</li>
            </ol>
            {wallets.map((w) => (
              <div key={w.id} className="walletline">
                {w.qr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="qrimg" src={`/api/pay/qr/${w.id}`} alt={`${w.id} QR code of the shop`} />
                )}
                <span>
                  <small>{w.id} QR code</small>
                  {w.number ? <b>{w.number}</b> : <b>Scan the QR code</b>}
                  {w.name && <em>{w.name}</em>}
                </span>
                {w.number && (
                  <button type="button" className="linkbtn" onClick={() => copy(w.number)}>{copied === w.number ? "Copied" : "Copy number"}</button>
                )}
              </div>
            ))}
            <label className="check">
              <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} />
              I want to send a deposit now (deducted from my final bill)
            </label>
          </div>
        )}
        </div>
        {msg && (
          <div role="status" className={`msg ${msg.kind}`}>
            {msg.text}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending..." : sel ? "Send inquiry" : "Pick a time to continue"}
        </button>
        <p className="note">We confirm by phone or email.</p>
      </form>
      </>
      )}
      {!done && (
        <div className="bookbar" role="region" aria-label="Booking summary">
          <span className="bookbar-text">
            <b>{svcName ?? "Choose a service"}</b>
            <small>{sel ? when : "then pick a time"}</small>
          </span>
          {sel && service ? (
            <button type="submit" form="bookform" className="btn" disabled={busy}>
              {busy ? "Sending..." : "Send inquiry"}
            </button>
          ) : (
            <span className="bookbar-step">{stepsDone} of 3</span>
          )}
        </div>
      )}
    </div>
  );
}
