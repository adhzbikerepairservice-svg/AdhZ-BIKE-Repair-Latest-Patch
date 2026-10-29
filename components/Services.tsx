import Link from "next/link";
import { SHOP } from "@/lib/shop";

const p = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ICONS: Record<string, React.ReactNode> = {
  repair: (
    <svg {...p}><path d="M14.500 6.500a4 4 0 0 0-5 5L4 17l3 3 5.500-5.500a4 4 0 0 0 5-5L15 12l-3-3z" /></svg>
  ),
  service: (
    <svg {...p}><path d="M12 3l1.800 4.700L18.500 9.500 13.800 11.300 12 16l-1.800-4.700L5.500 9.500l4.700-1.800zM19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z" /></svg>
  ),
  build: (
    <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900l2.100 2.100M17 17l2.100 2.100M19.100 4.900L17 7M7 17l-2.100 2.100" /></svg>
  ),
};

/** Full list for the Services page: icon + name + item count, every item as a row, then a Book button. */
export default function Services() {
  return (
    <div className="svcgrid">
      {SHOP.services.map((s) => (
        <article key={s.id} className="svccard">
          <header>
            <span className="tile-icon" aria-hidden>
              {ICONS[s.id]}
            </span>
            <span>
              <h3>{s.name}</h3>
              <small>
                {s.items.length} {s.items.length === 1 ? "service" : "services"}
              </small>
            </span>
          </header>
          <ul className="svcitems">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link href={`/book?service=${s.id}`} className="btn">
            Book {s.name.toLowerCase()}
          </Link>
        </article>
      ))}
    </div>
  );
}
