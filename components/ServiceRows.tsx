"use client";

import Link from "next/link";
import { useState } from "react";
import { SHOP } from "@/lib/shop";
import { ICONS } from "./Services";

const TEASER = 2;

/** Home page services: three panels side by side; the one you hover or tap opens wide to show a teaser and the Book button. */
export default function ServiceRows() {
  const [open, setOpen] = useState(SHOP.services[0].id);

  return (
    <div className="xpanels">
      {SHOP.services.map((s, i) => {
        const on = open === s.id;
        return (
          <article key={s.id} className={`xp${on ? " on" : ""}`} onMouseEnter={() => setOpen(s.id)} onFocus={() => setOpen(s.id)}>
            <button type="button" className="xp-head" aria-expanded={on} onClick={() => setOpen(s.id)}>
              <span className="xp-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <span className="tile-icon" aria-hidden>{ICONS[s.id]}</span>
              <span className="xp-title">
                <b>{s.name}</b>
                <small>{s.items.length} services</small>
              </span>
            </button>
            <ul className="xp-peek" aria-hidden>
              {s.items.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="xp-body">
              <ul>
                {s.items.slice(0, TEASER).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {s.items.length > TEASER && <li className="more">+{s.items.length - TEASER} more</li>}
              </ul>
              <div className="xp-actions">
                <Link href={`/book?service=${s.id}`} className="btn gold">Book this</Link>
                <Link href="/services" className="xp-link">See all</Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
