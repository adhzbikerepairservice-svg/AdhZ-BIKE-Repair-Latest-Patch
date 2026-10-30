"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SHOP } from "@/lib/shop";
import { ICONS } from "./Services";

const TEASER = 2;

/**
 * Home page services. Desktop: three panels side by side; the one you hover or tap opens wide to show a teaser and the Book button.
 * Phones: a swipeable row of cards (CSS turns the panels into a scroll-snap carousel) with dots underneath.
 */
export default function ServiceRows() {
  const [open, setOpen] = useState(SHOP.services[0].id);
  const [card, setCard] = useState(0); // phone carousel: which card is in view
  const row = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = row.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    setCard(Math.min(SHOP.services.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 12))));
  };
  const goTo = (i: number) => {
    const el = row.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  };

  return (
    <div className="xpwrap">
    <div className="xpanels" ref={row} onScroll={onScroll}>
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
              <div>
                <p className="xp-blurb">{s.blurb}</p>
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
            </div>
          </article>
        );
      })}
    </div>
    <div className="xp-dots">
      {SHOP.services.map((s, i) => (
        <button key={s.id} type="button" aria-label={`Show ${s.name}`} aria-current={card === i} onClick={() => goTo(i)} />
      ))}
    </div>
    </div>
  );
}
