"use client";

import Link from "next/link";
import { useState } from "react";
import { SHOP } from "@/lib/shop";
import { ICONS } from "./Services";

/** Services page: a switcher for the three services, and the chosen one shown large with every item as its own row. */
export default function ServiceTabs() {
  const [id, setId] = useState(SHOP.services[0].id);
  const s = SHOP.services.find((x) => x.id === id) ?? SHOP.services[0];

  return (
    <div className="stabs">
      <div className="stabs-bar" role="tablist" aria-label="Services">
        {SHOP.services.map((sv) => (
          <button key={sv.id} type="button" role="tab" aria-selected={id === sv.id} onClick={() => setId(sv.id)}>
            <span className="stabs-ic" aria-hidden>{ICONS[sv.id]}</span>
            <span>
              <b>{sv.name}</b>
              <small>{sv.items.length} services</small>
            </span>
          </button>
        ))}
      </div>

      <div className="stabs-body" key={s.id} role="tabpanel">
        <aside className="stabs-side">
          <span className="tile-icon big" aria-hidden>{ICONS[s.id]}</span>
          <h2>{s.name}</h2>
          <p>{s.items.length} {s.items.length === 1 ? "service" : "services"}. Tap one to book exactly that.</p>
          <Link className="btn gold" href={`/book?service=${s.id}`}>Book {s.name.toLowerCase()}</Link>
        </aside>
        <ul className="stabs-list">
          {s.items.map((item, i) => (
            <li key={item}>
              <Link href={`/book?service=${s.id}&item=${encodeURIComponent(item)}`} className="stabs-row">
              <span className="stabs-no">{String(i + 1).padStart(2, "0")}</span>
              <b>{item}</b>
              <span className="stabs-go">Book this</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
