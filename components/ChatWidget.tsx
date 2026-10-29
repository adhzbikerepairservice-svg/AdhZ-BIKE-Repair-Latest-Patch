"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import { social } from "@/lib/maps";

const ID_KEY = "adhz-chat-id";
const NAME_KEY = "adhz-chat-name";

// crypto.randomUUID only exists on https or localhost, so fall back for plain http (e.g. a phone on the same Wi-Fi).
const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);

/** Floating chat with the mechanic. Opens from the bubble or from anywhere via window.dispatchEvent(new Event("open-chat")). */
export default function ChatWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [away, setAway] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [fast, setFast] = useState(false); // poll every second right after sending, until a reply arrives
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      let saved = localStorage.getItem(ID_KEY);
      if (!saved) {
        saved = newId();
        localStorage.setItem(ID_KEY, saved);
      }
      setId(saved);
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      setId(newId());
    }
    const openIt = () => setOpen(true);
    window.addEventListener("open-chat", openIt);
    return () => window.removeEventListener("open-chat", openIt);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/chat?id=${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setAway(!!data.away);
        if (data.messages.at(-1)?.from !== "customer") {
          setFast(false);
          setThinking(false);
        }
      }
    } catch {
      /* keep what we have */
    }
  }, [id]);

  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, fast ? 1000 : 4000);
    return () => clearInterval(t);
  }, [open, load, fast]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const who = name || nameInput.trim();
    const msg = text.trim();
    if (!who) return setError("Please tell us your name first.");
    if (!msg) return;
    setError("");
    if (!name) {
      setName(who);
      try {
        localStorage.setItem(NAME_KEY, who);
      } catch {
        /* private mode */
      }
    }
    setText("");
    setMessages((m) => [...m, { from: "customer", text: msg, at: Date.now() }]);
    setThinking(away);
    setFast(true);
    setTimeout(() => {
      setFast(false);
      setThinking(false);
    }, 25000);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: who, text: msg }) });
    if (!res.ok) setError("Message not sent. Try again, or use WhatsApp.");
    load();
  }

  // The shop owner does not need the customer chat button on the admin pages.
  if (path.startsWith("/admin")) return null;

  return (
    <>
      <button type="button" className="chatfab" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="chatpanel" aria-label={open ? "Close chat" : "Chat with Adrian"} title={open ? "Close chat" : "Chat with Adrian"}>
        {open ? (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="5.500" cy="16" r="3.500" />
            <circle cx="18.500" cy="16" r="3.500" />
            <path d="M5.500 16 9 8h6l3.500 8M9 8l3 8 3-8M7.500 8h3M14 5.500h2.500" />
          </svg>
        )}
      </button>

      {open && (
        <div className="chatpanel" id="chatpanel" role="dialog" aria-label="Chat with the mechanic">
          <header>
            <span className="avatar-s">A</span>
            <span>
              <b>Adrian S. Guese</b>
              <small>{away ? "Away now · our assistant replies first" : "Mechanic · online now"}</small>
            </span>
          </header>
          <div className="chatlog" aria-live="polite">
            <div className="bubble shop">
              {away ? "Hi! Adrian is away from the website right now. I'm the shop's assistant, so ask me anything about your bike, our services or booking." : "Hi! Tell us about your bike and what you need. Adrian will reply here."}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                {m.from === "ai" && <small className="aitag">AI assistant</small>}
                {m.text}
              </div>
            ))}
            {thinking && (
              <div className="bubble ai typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={send}>
            {!name && <input aria-label="Your name" placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />}
            {error && <p className="note chaterr">{error}</p>}
            <div className="chatrow">
              <input aria-label="Message" placeholder="Type your message" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn sm" type="submit">
                Send
              </button>
            </div>
            <a className="note" href={social.whatsapp} target="_blank" rel="noreferrer">
              Prefer WhatsApp? Message us there
            </a>
          </form>
        </div>
      )}
    </>
  );
}
