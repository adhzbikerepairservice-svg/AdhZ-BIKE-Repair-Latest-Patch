"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatThread } from "@/lib/chat";
import BlockTimes from "./BlockTimes";
import AlertSettings from "./AlertSettings";
import PaymentSettings from "./PaymentSettings";
import { OWNER_STORAGE_KEY, ownerKeyOf } from "@/lib/ownerKey";
import { dayLong, getMech, getService, hourLabel, Inquiry, ymd } from "@/lib/shop";

type Filter = "pending" | "confirmed" | "done" | "declined" | "all";
type Tab = "bookings" | "today" | "visits" | "customers" | "messages" | "block" | "payments" | "alerts";
const KEY = OWNER_STORAGE_KEY;

/** Digits-only phone for tel:/WhatsApp links; returns "" when the contact looks like an email. */
function phoneOf(contact: string) {
  const d = contact.replace(/[^\d+]/g, "");
  return d.replace(/\D/g, "").length >= 7 ? d : "";
}
/** "now", "5m", "3h" or a short date, for the inbox list. */
function timeAgo(at: number) {
  const m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return new Date(at).toLocaleDateString([], { month: "short", day: "numeric" });
}
const waNumber =(p: string) => (p.startsWith("+") ? p.slice(1) : p.startsWith("0") ? "63" + p.slice(1) : p);

/** Shop owner dashboard: simple sign-in, stats, bookings with one-tap contact, today's visits and customer chat. */
export default function AdminDashboard() {
  const [key, setKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"gmail" | "password">("gmail");
  const [gmail, setGmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Inquiry[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [tab, setTab] = useState<Tab>("bookings");
  const [filter, setFilter] = useState<Filter>("pending");
  const [q, setQ] = useState("");
  const [openChat, setOpenChat] = useState("");
  const [chatQ, setChatQ] = useState("");
  const threadEnd = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState("");
  const [doing, setDoing] = useState("");
  const [lines, setLines] = useState<{ label: string; amount: string }[]>([{ label: "", amount: "" }]);
  const [rnote, setRnote] = useState("");
  const [cq, setCq] = useState("");
  const [pay, setPay] = useState<"cash" | "ewallet">("cash");
  const [payRef, setPayRef] = useState("");
  const [doneMsg, setDoneMsg] = useState<{ id: string; text: string; link: string; mail: string } | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);

  const headers = useMemo(() => (key ? { "x-owner-key": key } : undefined), [key]);

  const forget = () => {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    if (key === null) return;
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store", headers });
      if (res.status === 403) {
        forget();
        setKey(null);
        setError("Your saved sign-in is no longer valid. Please sign in again.");
        return;
      }
      if (res.ok) {
        setItems((await res.json()).inquiries);
        setUpdated(new Date());
      }
      const c = await fetch("/api/chat?all=1", { cache: "no-store", headers });
      if (c.ok) setChats((await c.json()).threads);
    } catch {
      /* keep what we have */
    }
  }, [key, headers]);

  // On open: use a saved key, or try without one (works when the site has no owner key set).
  useEffect(() => {
    (async () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
      } catch {
        /* ignore */
      }
      const tryKey = saved ?? "";
      try {
        const res = await fetch("/api/inquiries", { cache: "no-store", headers: { "x-owner-key": tryKey } });
        if (res.ok) setKey(tryKey);
      } catch {
        /* show the sign-in form */
      }
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (key === null) return;
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [key, load]);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const unreadCount = chats.filter((c) => c.unread).length;
  useEffect(() => {
    if (key === null) return;
    const n = pendingCount + unreadCount;
    document.title = `${n ? `(${n}) ` : ""}Admin | ADHZ Bike Repair & Service`;
  }, [key, pendingCount, unreadCount]);

  const openLen = chats.find((c) => c.id === openChat)?.messages.length ?? 0;
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [openChat, openLen]);

  async function unlock() {
    setError("");
    const attempt = ownerKeyOf(username, input);
    const res = await fetch("/api/inquiries", { cache: "no-store", headers: { "x-owner-key": attempt } });
    if (res.ok) {
      try {
        (remember ? localStorage : sessionStorage).setItem(KEY, attempt);
      } catch {
        /* ignore */
      }
      setKey(attempt);
    } else setError("Wrong username or password. Check them and try again.");
  }

  async function askCode() {
    setError("");
    setNotice("");
    const res = await fetch("/api/auth/code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: gmail }) });
    const d = await res.json().catch(() => ({}));
    if (d.devCode) setNotice(`Development mode: Gmail is not connected yet, so here is your code: ${d.devCode}`);
    else if (d.notConfigured) { setError("The code could not be emailed because Gmail is not connected on the server yet (the app password is missing). Use the Username tab to sign in for now."); setStep("email"); return; }
    else if (d.wait) setNotice("A code was just sent. Wait a moment, then use the newest email.");
    else setNotice(`If ${gmail.trim()} is an admin Gmail, a 6-digit code is on its way. Check Spam too.`);
    setStep("code");
  }

  async function verifyCode() {
    setError("");
    const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: gmail, code }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setError(d.error === "wrong" ? "That code is not right. Check it and try again." : "That code expired. Tap Send a new code.");
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, d.key);
    } catch {
      /* ignore */
    }
    setKey(d.key);
  }

  const post = (url: string, method: string, body: unknown) =>
    fetch(url, { method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

  async function act(id: string, action: "confirm" | "decline") {
    await post("/api/inquiries", "PATCH", { id, action });
    load();
  }
  async function finish(i: Inquiry) {
    const clean = lines.filter((l) => l.label.trim() && Number(l.amount) >= 0 && l.amount !== "").map((l) => ({ label: l.label.trim(), amount: Number(l.amount) }));
    if (!clean.length) return;
    const res = await post("/api/inquiries", "PATCH", { id: i.id, action: "done", lines: clean, note: rnote, payment: pay, payRef });
    if (res.ok) {
      const r = await res.json();
      const sub = encodeURIComponent(`Your receipt from ADHZ Bike Repair & Service (${r.no})`);
      const body = encodeURIComponent(`Hi ${i.name},\n\nYour bike service is done. Thank you!\nYour receipt: ${r.link}\n\nADHZ Bike Repair & Service\n0969 333 3473`);
      setDoneMsg({ id: i.id, text: (r.refund ? `Refund ₱${Number(r.refund).toLocaleString("en-PH")} to the customer (deposit was more than the bill). ` : "") + (r.emailed ? `Receipt ${r.no} emailed to ${i.email}.` : `Receipt ${r.no} created but NOT emailed (${r.error ?? "unknown"}). Use Email it, or Send again once email is set up.`), link: r.link, mail: `mailto:${i.email}?subject=${sub}&body=${body}` });
      setDoing("");
      setLines([{ label: "", amount: "" }]);
      setRnote("");
      setPay("cash");
      setPayRef("");
      load();
    }
  }
  async function sendReply(id: string) {
    const text = reply.trim();
    if (!text) return;
    setReply("");
    await post("/api/chat", "POST", { id, text, reply: true });
    load();
  }
  async function openThread(id: string) {
    setOpenChat(id);
    await post("/api/chat", "POST", { id, read: true });
    load();
  }

  if (checking) {
    return (
      <section className="adminlock">
        <p className="note">Opening...</p>
      </section>
    );
  }

  if (key === null) {
    return (
      <section className="adminlock">
        <div className="panel loginbox">
          <span className="loginicon" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <h1>Shop admin</h1>
          <p className="note">Sign in to confirm bookings and answer customers.</p>
          <div className="seg" role="tablist" aria-label="Sign-in method">
            <button type="button" role="tab" aria-checked={mode === "gmail"} onClick={() => { setMode("gmail"); setError(""); }}>
              <b>Gmail</b>
            </button>
            <button type="button" role="tab" aria-checked={mode === "password"} onClick={() => { setMode("password"); setError(""); }}>
              <b>Username</b>
            </button>
          </div>
          {mode === "gmail" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === "email") askCode();
                else verifyCode();
              }}
            >
              <label htmlFor="adminGmail">
                Admin Gmail
                <input id="adminGmail" type="email" autoComplete="email" inputMode="email" placeholder="yourshop@gmail.com" value={gmail} onChange={(e) => setGmail(e.target.value)} disabled={step === "code"} autoFocus />
              </label>
              {step === "code" && (
                <label htmlFor="adminCode">
                  6-digit code from your email
                  <input id="adminCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
                </label>
              )}
              {notice && <div className="msg good">{notice}</div>}
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Keep me signed in on this device
              </label>
              {error && <div className="msg err">{error}</div>}
              <button className="btn" type="submit" disabled={step === "email" ? !gmail.includes("@") : code.length < 6}>
                {step === "email" ? "Email me a code" : "Sign in"}
              </button>
              {step === "code" && (
                <button type="button" className="linkbtn" onClick={() => { setStep("email"); setCode(""); setNotice(""); setError(""); }}>
                  Use a different Gmail or send a new code
                </button>
              )}
            </form>
          )}
          {mode === "password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              unlock();
            }}
          >
            <label htmlFor="ownerUser">
              Username
              <input id="ownerUser" autoComplete="username" autoCapitalize="characters" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </label>
            <label htmlFor="ownerKey">
              Password
              <span className="pwrow">
                <input id="ownerKey" type={show ? "text" : "password"} autoComplete="current-password" value={input} onChange={(e) => setInput(e.target.value)} />
                <button type="button" className="linkbtn" onClick={() => setShow((v) => !v)}>
                  {show ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Keep me signed in on this device
            </label>
            {error && <div className="msg err">{error}</div>}
            <button className="btn" type="submit">
              Sign in
            </button>
          </form>
          )}
        </div>
      </section>
    );
  }

  const active = chats.find((c) => c.id === openChat);
  const today = ymd(new Date());
  const live = items.filter((i) => i.status !== "declined");
  const count = (s: Inquiry["status"]) => items.filter((i) => i.status === s).length;
  const todays = live.filter((i) => i.date === today).sort((a, b) => a.hour - b.hour);
  const upcoming = live.filter((i) => i.date >= today && i.status !== "done").length;
  const customers = [...items.filter((i) => i.status !== "declined" || i.receipt).reduce((m, i) => { const k = (i.email || i.contact).toLowerCase(); const c = m.get(k) ?? { email: i.email, name: i.name, phone: i.contact, visits: [] as Inquiry[], receipts: [] as Inquiry[], last: 0 }; c.visits.push(i); if (i.receipt) c.receipts.push(i); c.last = Math.max(c.last, i.createdAt); c.name = i.name; c.phone = i.contact; return m.set(k, c); }, new Map<string, { email: string; name: string; phone: string; visits: Inquiry[]; receipts: Inquiry[]; last: number }>()).values()]
    .filter((c) => !cq.trim() || (c.name + " " + c.email + " " + c.phone).toLowerCase().includes(cq.trim().toLowerCase()))
    .sort((a, b) => b.last - a.last);
  const upcomingByDay = [...live.filter((i) => i.date >= today && i.status !== "done").reduce((m, i) => m.set(i.date, [...(m.get(i.date) ?? []), i]), new Map<string, Inquiry[]>())]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, l]) => [d, l.sort((a, b) => a.hour - b.hour)] as [string, Inquiry[]]);
  const needle = q.trim().toLowerCase();
  const shown = items
    .filter((i) => filter === "all" || i.status === filter)
    .filter((i) => !needle || [i.name, i.contact, i.bike, i.brand, i.notes].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => (a.date + String(a.hour).padStart(2, "0")).localeCompare(b.date + String(b.hour).padStart(2, "0")));

  const FILTERS: [Filter, string, number][] = [
    ["pending", "Needs you", count("pending")],
    ["confirmed", "Confirmed", count("confirmed")],
    ["done", "Done", count("done")],
    ["declined", "Declined", count("declined")],
    ["all", "All", items.length],
  ];
  const TABS: [Tab, string, number][] = [
    ["bookings", "Bookings", pendingCount],
    ["today", "Today", todays.length],
    ["visits", "Visits", 0],
    ["customers", "Customers", 0],
    ["messages", "Messages", unreadCount],
    ["block", "Block times", 0],
    ["payments", "Payments", 0],
    ["alerts", "Phone alerts", 0],
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const ICON: Record<Tab, string> = {
    bookings: "M7 3h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z",
    today: "M4 6h16M4 12h16M4 18h10",
    customers: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0",
    visits: "M5 4h14a2 2 0 0 1 2 2v14l-4-3-3 3-3-3-4 3V6a2 2 0 0 1 2-2zM8 9h8M8 13h5",
    messages: "M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.500A8 8 0 1 1 21 12z",
    block: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    payments: "M3 7h18v12H3zM3 11h18M7 15h3",
    alerts: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.700 21a2 2 0 0 1-3.400 0",
  };
  const navIcon = (d: string) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );

  return (
    <section className="adminshell">
      <aside className="adminnav" aria-label="Admin menu">
        <div className="adminbrand">
          <span className="avatar-s">A</span>
          <span>
            <b>Adrian S. Guese</b>
            <small>Shop admin</small>
          </span>
        </div>
        <nav>
          {TABS.map(([t, label, n]) => (
            <button key={t} type="button" aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)}>
              {navIcon(ICON[t])}
              <span>{label}</span>
              {n > 0 && <small className="dotcount">{n}</small>}
            </button>
          ))}
          <button
            type="button"
            className="navout"
            onClick={() => {
              forget();
              setKey(null);
              setInput("");
              setUsername("");
            }}
          >
            {navIcon("M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3")}
            <span>Sign out</span>
          </button>
        </nav>
      </aside>

      <div className="adminmain">
      <div className="adminhello">
        <div>
          <h1>{greeting}, Adrian</h1>
          <p className="note">
            {dayLong(today)} · {pendingCount ? `${pendingCount} booking${pendingCount > 1 ? "s" : ""} waiting for you` : "nothing waiting for you"}
          </p>
        </div>
        <span className="note">{updated ? `Updated ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Loading..."}</span>
      </div>

      <div className="stats">
        <button
          type="button"
          className="stat warn"
          onClick={() => {
            setTab("bookings");
            setFilter("pending");
          }}
        >
          <b>{pendingCount}</b>
          <span>Waiting for you</span>
        </button>
        <button type="button" className="stat" onClick={() => setTab("today")}>
          <b>{todays.length}</b>
          <span>Visits today</span>
        </button>
        <div className="stat">
          <b>{upcoming}</b>
          <span>Upcoming visits</span>
        </div>
        <button type="button" className="stat" onClick={() => setTab("messages")}>
          <b>{unreadCount}</b>
          <span>New messages</span>
        </button>
      </div>

      {tab === "bookings" && (
        <div className="inbox">
          <div className="inbox-top">
            <div className="tabs" role="tablist">
              {FILTERS.map(([f, label, n]) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                  {label} <small>{n}</small>
                </button>
              ))}
            </div>
            <input type="search" placeholder="Search name, phone, bike" aria-label="Search bookings" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {shown.length === 0 ? (
            <div className="empty">{filter === "pending" ? "All caught up. Nothing is waiting for you." : "No bookings here yet."}</div>
          ) : (
            <div className="queue">
              {shown.map((i) => {
                const phone = phoneOf(i.contact);
                return (
                  <article key={i.id} className="inq">
                    <div>
                      <h3>
                        {i.name} <span className={`badge ${i.status}`}>{i.status}</span>
                      </h3>
                      <p>
                        <b>{getService(i.service)?.name ?? i.service}</b> · {i.bike}
                        {i.brand ? ` (${i.brand})` : ""} · {i.contact}
                      </p>
                      <p>
                        {getMech(i.mech)?.name} · {dayLong(i.date)} at {hourLabel(i.hour)}
                      </p>
                      <p>
                        {i.handover === "collect" ? `Home pick-up and delivery (extra fee) · ${i.address || "no address"}` : "Customer brings it in and picks it up"}
                        {i.pickup ? ` · Wants it ${i.handover === "collect" ? "delivered" : "ready"} ${dayLong(i.pickup)}` : " · Call when ready"}
                      </p>
                      {i.notes && <p>&ldquo;{i.notes}&rdquo;</p>}
                      <p>
                        Email: <a href={`mailto:${i.email}`}>{i.email}</a> · Will pay by {i.payPref === "ewallet" ? "e-wallet" : "cash"}
                      </p>
                      {i.advance && (
                        <p>
                          Deposit: ₱{i.advance.amount.toLocaleString("en-PH")} via {i.advance.wallet || "e-wallet"}, ref {i.advance.ref} · {i.advance.status === "confirmed" ? "confirmed" : "waiting for you to check"}{" "}
                          {i.advance.status === "submitted" && (
                            <button type="button" className="linkbtn" onClick={async () => { await post("/api/inquiries", "PATCH", { id: i.id, action: "confirmadvance" }); load(); }}>
                              Confirm deposit received
                            </button>
                          )}
                        </p>
                      )}
                      {i.payNow && !i.advance && <p>Customer plans to send a deposit by e-wallet.</p>}
                      {i.receipt?.payment === "ewallet" && i.receipt.payStatus && i.receipt.payStatus !== "paid" && (
                        <div className="msg err">
                          {i.receipt.payStatus === "submitted" ? `Customer says they paid ₱${i.receipt.total.toLocaleString("en-PH")} via ${i.receipt.wallet || "e-wallet"}, ref ${i.receipt.payRef}. Check your e-wallet.` : "Waiting for the customer to pay by e-wallet."}{" "}
                          <button type="button" className="linkbtn" onClick={async () => { await post("/api/inquiries", "PATCH", { id: i.id, action: "markpaid" }); load(); }}>
                            {i.receipt.payStatus === "submitted" ? "Confirm payment received" : "Mark as paid"}
                          </button>
                        </div>
                      )}
                      {i.receipt?.refund ? <div className="msg err">The deposit was ₱{i.receipt.refund.toLocaleString("en-PH")} more than the bill. Please refund that amount to the customer.</div> : null}
                      {i.receipt && (
                        <p>
                          Receipt {i.receipt.no} · ₱{i.receipt.total.toLocaleString("en-PH")} · {i.receipt.emailed ? `emailed to ${i.email}` : "not emailed yet"}{" "}
                          {!i.receipt.emailed && (
                            <button type="button" className="linkbtn" onClick={async () => { const x = await post("/api/inquiries", "PATCH", { id: i.id, action: "resend" }); const d = await x.json(); setDoneMsg({ id: i.id, text: d.emailed ? `Receipt emailed to ${i.email}.` : `Still not sent: ${d.error ?? "unknown"}`, link: `/receipt/${i.id}`, mail: `mailto:${i.email}` }); load(); }}>Send again</button>
                          )}
                        </p>
                      )}
                      {doneMsg?.id === i.id && (
                        <div className="msg good">
                          {doneMsg.text}{" "}
                          <a href={doneMsg.mail}>Email it</a> · <a href={doneMsg.link} target="_blank" rel="noreferrer">Open receipt</a>
                        </div>
                      )}
                      {doing === i.id && (
                        <div className="receiptform">
                          <b>Receipt for {i.name}</b>
                          {lines.map((l, k) => (
                            <div key={k} className="rline">
                              <input aria-label="What was done" placeholder="What was done (e.g. Brake bleeding)" value={l.label} onChange={(e) => setLines((ls) => ls.map((x, n) => (n === k ? { ...x, label: e.target.value } : x)))} />
                              <input aria-label="Amount in pesos" type="number" min="0" inputMode="decimal" placeholder="₱ amount" value={l.amount} onChange={(e) => setLines((ls) => ls.map((x, n) => (n === k ? { ...x, amount: e.target.value } : x)))} />
                            </div>
                          ))}
                          <button type="button" className="linkbtn" onClick={() => setLines((ls) => [...ls, { label: "", amount: "" }])}>Add another line</button>
                          <div className="seg" role="radiogroup" aria-label="Mode of payment">
                            <button type="button" role="radio" aria-checked={pay === "cash"} onClick={() => setPay("cash")}><b>Cash</b></button>
                            <button type="button" role="radio" aria-checked={pay === "ewallet"} onClick={() => setPay("ewallet")}><b>E-wallet</b><small>GCash, Maya, etc.</small></button>
                          </div>
                          {pay === "ewallet" && <input aria-label="E-wallet reference number" placeholder="Reference number (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} />}
                          <input aria-label="Note" placeholder="Note on the receipt (optional)" value={rnote} onChange={(e) => setRnote(e.target.value)} />
                          <button type="button" className="btn" onClick={() => finish(i)}>Create receipt{i.email ? " and email it" : ""}</button>
                        </div>
                      )}
                    </div>
                    <div className="acts">
                      {i.status === "pending" && (
                        <button className="btn sm" onClick={() => act(i.id, "confirm")}>
                          Confirm
                        </button>
                      )}
                      {i.status === "confirmed" && (
                        <button className="btn sm" onClick={() => { setPay(i.payPref === "ewallet" ? "ewallet" : "cash"); setDoing(doing === i.id ? "" : i.id); }}>
                          Mark done
                        </button>
                      )}
                      {i.status === "done" && i.receipt && (
                        <a className="btn sm" href={`/receipt/${i.id}`} target="_blank" rel="noreferrer">
                          Receipt
                        </a>
                      )}
                      {(i.status === "pending" || i.status === "confirmed") && (
                        <button className="btn ghost" onClick={() => act(i.id, "decline")}>
                          Decline
                        </button>
                      )}
                      {phone && (
                        <>
                          <a className="btn ghost" href={`tel:${phone}`}>
                            Call
                          </a>
                          <a
                            className="btn ghost"
                            href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(`Hi ${i.name}, this is Adrian from ADHZ Bike Repair about your ${dayLong(i.date)} visit.`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "today" && (
        <div className="panel">
          <h3>Today, {dayLong(today)}</h3>
          {todays.length === 0 ? (
            <p className="note">Nothing booked for today.</p>
          ) : (
            <ul className="agenda">
              {todays.map((i) => (
                <li key={i.id}>
                  <span className="mono">{hourLabel(i.hour)}</span>
                  <span>
                    <b>{i.name}</b>
                    <small>
                      {getService(i.service)?.name} · {i.bike} · {i.contact}
                    </small>
                  </span>
                  <span className={`badge ${i.status}`}>{i.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "visits" && (
        <div className="visitsview">
          {upcomingByDay.length === 0 ? (
            <div className="empty">No upcoming visits yet.</div>
          ) : (
            upcomingByDay.map(([date, list]) => (
              <div key={date} className="panel">
                <h3>
                  {date === today ? "Today" : dayLong(date)} <small className="note">{list.length} visit{list.length > 1 ? "s" : ""}</small>
                </h3>
                <ul className="agenda">
                  {list.map((i) => (
                    <li key={i.id}>
                      <span className="mono">{hourLabel(i.hour)}</span>
                      <span>
                        <b>{i.name}</b>
                        <small>
                          {getService(i.service)?.name} · {i.bike} · {i.contact}
                          {i.handover === "collect" ? " · home pick-up" : ""}
                        </small>
                      </span>
                      <span className={`badge ${i.status}`}>{i.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "customers" && (
        <div className="inbox">
          <div className="inbox-top">
            <h3>
              Customers <small className="note">{customers.length}</small>
            </h3>
            <input type="search" placeholder="Search name, email, phone" aria-label="Search customers" value={cq} onChange={(e) => setCq(e.target.value)} />
          </div>
          {customers.length === 0 ? (
            <div className="empty">No customers yet. They appear here after their first booking.</div>
          ) : (
            <div className="queue">
              {customers.map((c) => (
                <article key={c.email} className="inq custrow">
                  <div>
                    <h3>{c.name}</h3>
                    <p>
                      <a href={`mailto:${c.email}`}>{c.email}</a> · {c.phone}
                    </p>
                    <p>
                      {c.visits.length} booking{c.visits.length > 1 ? "s" : ""} · {c.receipts.length} receipt{c.receipts.length === 1 ? "" : "s"}
                      {c.receipts.length > 0 && ` · ₱${c.receipts.reduce((n, r) => n + (r.receipt?.total ?? 0), 0).toLocaleString("en-PH")} paid`}
                    </p>
                    {c.receipts.length > 0 && (
                      <ul className="rcplist">
                        {c.receipts.map((r) => (
                          <li key={r.id}>
                            <span>
                              <b>{r.receipt!.no}</b> · {getService(r.service)?.name} · ₱{r.receipt!.total.toLocaleString("en-PH")} · {r.receipt!.payment === "ewallet" ? "E-wallet" : "Cash"}
                            </span>
                            <span>
                              <a href={`/receipt/${r.id}`} target="_blank" rel="noreferrer">View</a> · <a href={`/receipt/${r.id}/pdf`}>PDF</a>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="acts">
                    {phoneOf(c.phone) && <a className="btn ghost" href={`tel:${phoneOf(c.phone)}`}>Call</a>}
                    <a className="btn ghost" href={`mailto:${c.email}`}>Email</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "block" && <BlockTimes headers={headers} />}
      {tab === "payments" && <PaymentSettings headers={headers} />}
      {tab === "alerts" && <AlertSettings headers={headers} />}

      {tab === "messages" && (
        <div className={`inboxchat${openChat ? " reading" : ""}`}>
          <aside className="inboxlist" aria-label="All customer chats">
            <div className="inboxhead">
              <h3>
                Inbox <small>{chats.length}</small>
              </h3>
              <input type="search" placeholder="Search chats" aria-label="Search chats" value={chatQ} onChange={(e) => setChatQ(e.target.value)} />
            </div>
            {chats.length === 0 ? (
              <p className="note pad">No chats yet. When a customer writes from the website, it shows up here.</p>
            ) : (
              <ul>
                {chats
                  .filter((c) => !chatQ.trim() || (c.name + " " + c.messages.map((m) => m.text).join(" ")).toLowerCase().includes(chatQ.trim().toLowerCase()))
                  .map((c) => {
                    const last = c.messages.at(-1);
                    return (
                      <li key={c.id}>
                        <button type="button" className={`inboxrow${openChat === c.id ? " active" : ""}${c.unread ? " unread" : ""}`} onClick={() => openThread(c.id)}>
                          <span className="avatar-s">{c.name.slice(0, 1).toUpperCase() || "?"}</span>
                          <span className="inboxtext">
                            <b>{c.name}</b>
                            <small>
                              {last?.from === "shop" ? "You: " : last?.from === "ai" ? "AI: " : ""}
                              {last?.text}
                            </small>
                          </span>
                          <span className="inboxmeta">
                            {last && <time>{timeAgo(last.at)}</time>}
                            {c.unread && <i className="newdot" aria-label="Unread" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </aside>

          <div className="inboxthread">
            {active ? (
              <>
                <header>
                  <button type="button" className="linkbtn backlist" onClick={() => setOpenChat("")}>
                    All chats
                  </button>
                  <span className="avatar-s">{active.name.slice(0, 1).toUpperCase()}</span>
                  <b>{active.name}</b>
                  <span className="note">{active.messages.length} messages</span>
                </header>
                <div className="threadlog">
                  {active.messages.map((m, i) => (
                    <div key={i} className={`bubble ${m.from === "customer" ? "shop" : m.from === "ai" ? "ai" : "customer"}`}>
                      {m.from === "ai" && <small className="aitag">AI assistant replied</small>}
                      {m.text}
                      <time>{new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                    </div>
                  ))}
                  <div ref={threadEnd} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendReply(active.id);
                  }}
                >
                  <div className="chatrow">
                    <input aria-label="Reply" placeholder={`Reply to ${active.name}`} value={reply} onChange={(e) => setReply(e.target.value)} autoFocus />
                    <button className="btn sm" type="submit">
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="inboxempty">
                <b>Select a conversation</b>
                <p className="note">Every customer chat from the website is collected here. Pick one to read and reply.</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
