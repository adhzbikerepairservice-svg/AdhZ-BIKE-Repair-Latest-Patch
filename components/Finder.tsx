"use client";

import Link from "next/link";
import { useState } from "react";
import { getService } from "@/lib/shop";

// Hotspots sit on the drawing as percentages of its 600 x 330 box.
const PARTS = [
  { id: "brakes", name: "Brakes", says: "They feel weak or spongy", service: "repair", item: "Brake bleeding", x: 78, y: 54 },
  { id: "tyres", name: "Tyres", says: "Tubeless keeps losing air", service: "repair", item: "Tubeless set-up", x: 93, y: 78 },
  { id: "drive", name: "Chain and gears", says: "Noisy chain, gears skip", service: "service", item: "Bike wash with tune up", x: 30, y: 74 },
  { id: "check", name: "Full check-up", says: "A long time since a proper check", service: "service", item: "Bike spa", x: 48, y: 48 },
  { id: "build", name: "New build", says: "I have a frame and parts", service: "build", item: "Full bike build", x: 62, y: 30 },
  { id: "upgrade", name: "Upgrades", says: "Dropper post or hidden cables", service: "build", item: "Dropper or internal routing", x: 43, y: 22 },
];

/** "What does your bike need?": tap a glowing spot on the bike; a card names the part, the service and a Book button. */
export default function Finder() {
  const [id, setId] = useState<string | null>(null);
  const part = PARTS.find((p) => p.id === id) ?? null;
  const svc = part ? getService(part.service) : null;

  return (
    <div className="diag">
      <div className="diag-copy">
        <h2>What does your bike need?</h2>
        <p>Tap a glowing spot on the bike.</p>
      </div>

      <div className="diag-stage">
        <svg className="diag-bike" viewBox="0 0 600 330" role="img" aria-label="Drawing of a bike with tappable parts">
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="115" cy="235" r="88" stroke="#1e2b52" strokeWidth="11" />
            <circle cx="115" cy="235" r="76" stroke="#8fb4ee" strokeWidth="2" strokeDasharray="3 7" />
            <circle cx="480" cy="235" r="88" stroke="#1e2b52" strokeWidth="11" />
            <circle cx="480" cy="235" r="76" stroke="#8fb4ee" strokeWidth="2" strokeDasharray="3 7" />
            <path d="M115 235 L262 238 L240 112 Z M240 112 L412 118 L262 238 M412 118 L480 235" stroke="#f2b922" strokeWidth="10" />
            <path d="M412 118 L400 92 L440 92 M215 106 L262 106" stroke="#1e2b52" strokeWidth="9" />
            <circle cx="262" cy="238" r="16" stroke="#1e2b52" strokeWidth="6" fill="#fff" />
            <path d="M262 238 L120 235" stroke="#1e2b52" strokeWidth="3" strokeDasharray="2 6" opacity="0.5" />
          </g>
          <circle cx="115" cy="235" r="9" fill="#1e2b52" />
          <circle cx="480" cy="235" r="9" fill="#1e2b52" />
        </svg>
        {PARTS.map((p) => (
          <button key={p.id} type="button" className="hot" aria-pressed={id === p.id} aria-label={`${p.name}: ${p.says}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => setId(p.id)}>
            <span className="hot-ring" aria-hidden />
            <span className="hot-tip">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="diag-card" aria-live="polite">
        {part && svc ? (
          <div key={part.id} className="diag-in">
            <span className="fbadge">{part.name}</span>
            <p className="diag-says">&ldquo;{part.says}&rdquo;</p>
            <span className="diag-arrow">We suggest</span>
            <b className="fname">{svc.name}</b>
            <span className="fitem">Start with {part.item}</span>
            <Link className="btn gold" href={`/book?service=${part.service}`}>Book {svc.name.toLowerCase()}</Link>
          </div>
        ) : (
          <div className="diag-idle">
            <b>Pick a part</b>
            <span>The right service appears here.</span>
          </div>
        )}
        <button type="button" className="linkbtn diag-else" onClick={() => window.dispatchEvent(new Event("open-chat"))}>
          Not on the bike? Chat with Adrian
        </button>
      </div>
    </div>
  );
}
