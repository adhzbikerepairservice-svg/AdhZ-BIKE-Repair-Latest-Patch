import Link from "next/link";
import { SHOP } from "@/lib/shop";
import { ICONS } from "./Services";

const TEASER = 2;

/** Home page service teaser: icon + name, a couple of items, then Details / Book. The full list lives on /services. */
export default function ServiceRows() {
  return (
    <div className="tiles">
      {SHOP.services.map((s) => (
        <article key={s.id} className="tile">
          <header className="tile-head">
            <span className="tile-icon" aria-hidden>
              {ICONS[s.id]}
            </span>
            <h3>{s.name}</h3>
          </header>
          <ul>
            {s.items.slice(0, TEASER).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {s.items.length > TEASER && <li className="more-chip">+{s.items.length - TEASER} more</li>}
          </ul>
          <footer className="tile-foot">
            <Link href="/services" className="tile-link">
              Details
            </Link>
            <Link href={`/book?service=${s.id}`} className="btn sm">
              Book this
            </Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
