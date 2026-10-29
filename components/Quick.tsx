"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADDRESS_SHORT, mapLinks } from "@/lib/maps";
import { hourLabel, isClosed, SHOP } from "@/lib/shop";

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Live open/closed text from the shop hours, using the visitor's clock. */
function status(now: Date) {
  const h = now.getHours() + now.getMinutes() / 60;
  if (!isClosed(now) && h >= SHOP.open && h < SHOP.close) {
    const left = SHOP.close - h;
    return { open: true, title: "Open now", detail: left <= 1 ? `Closing soon, at ${hourLabel(SHOP.close)}` : `Until ${hourLabel(SHOP.close)} today` };
  }
  if (!isClosed(now) && h < SHOP.open) return { open: false, title: "Closed", detail: `Opens today at ${hourLabel(SHOP.open)}` };
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (!isClosed(d)) return { open: false, title: "Closed", detail: `Opens ${i === 1 ? "tomorrow" : DAYS[d.getDay()]} at ${hourLabel(SHOP.open)}` };
  }
  return { open: false, title: "Closed", detail: "" };
}

/** Three quick facts under the hero, each with its own one-tap action. */
export default function Quick() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const st = now ? status(now) : null;

  return (
    <div className="quick">
      <div className="qcard">
        <span className="qicon"><svg {...icon}><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg></span>
        <span className="qtext">
          <small>Call or text</small>
          <b>0969 333 3473</b>
        </span>
        <a className="qact" href="tel:+639693333473">Call</a>
      </div>

      <div className="qcard">
        <span className="qicon"><svg {...icon}><path d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z" /><circle cx="12" cy="9" r="2.500" /></svg></span>
        <span className="qtext">
          <small>Find us</small>
          <b>{ADDRESS_SHORT}</b>
        </span>
        <a className="qact" href={mapLinks.waze} target="_blank" rel="noreferrer">Directions</a>
      </div>

      <div className="qcard">
        <span className="qicon"><svg {...icon}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span>
        <span className="qtext">
          <small>Hours</small>
          <b>{st ? st.detail || "Mon to Sat" : "Mon to Sat, 9 AM to 5 PM"}</b><em>Mon to Sat, 9 AM to 5 PM</em>
        </span>
        {st ? (
          <span className={`qlive ${st.open ? "open" : "closed"}`} title={st.detail}>
            <i aria-hidden />
            {st.title}
          </span>
        ) : (
          <Link className="qact" href="/contact">Hours</Link>
        )}
      </div>
    </div>
  );
}
