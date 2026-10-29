"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/", label: "Home", short: "Home", icon: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/services", label: "Services", short: "Services", icon: "M14.500 6.500a4 4 0 0 0-5 5L4 17l3 3 5.500-5.500a4 4 0 0 0 5-5L15 12l-3-3z" },
  { href: "/showcase", label: "Showcase", short: "Showcase", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" },
  { href: "/book", label: "Book a visit", short: "Book", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { href: "/contact", label: "Contact", short: "Contact", icon: "M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" },
];

export default function SiteNav() {
  const path = usePathname();
  // Tapping the page you are already on scrolls back to its top.
  const toTop = (href: string) => () => path === href && window.scrollTo({ top: 0, behavior: "smooth" });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false); // compact bar once the page is scrolled
  const [hover, setHover] = useState<number | null>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeIdx = LINKS.findIndex((l) => l.href === path);
  const lit = hover ?? (activeIdx >= 0 ? activeIdx : null);
  const place = useCallback(() => {
    const el = lit === null ? null : (listRef.current?.children[lit + 1] as HTMLElement | undefined);
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [lit]);
  useLayoutEffect(place, [place]);
  useEffect(() => {
    window.addEventListener("resize", place);
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", on);
    };
  }, [place]);
  const [going, setGoing] = useState(false); // a page change is under way: show the top progress bar

  // Close the phone menu after navigating, on Escape, and lock page scroll while it is open.
  useEffect(() => {
    setOpen(false);
    setGoing(false);
  }, [path]);
  // any click on an internal link to another page starts the progress bar and fades the current page out
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href^=\"/\"]") as HTMLAnchorElement | null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.getAttribute("href")?.includes("#")) return;
      if (new URL(a.href).pathname !== window.location.pathname) setGoing(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  // Every page change starts at the top, instantly. (Smooth scrolling plus late-loading content could leave a page stuck part-way down.)
  useEffect(() => {
    if (window.location.hash) return;
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    top();
    // once more after images, fonts and animations settle, in case late layout shifted the page down
    const t = [requestAnimationFrame(top), window.setTimeout(top, 150), window.setTimeout(top, 500)];
    return () => {
      cancelAnimationFrame(t[0] as number);
      clearTimeout(t[1]);
      clearTimeout(t[2]);
    };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  // On the shop admin only the logo bar stays; the public links, call button and tab bar are hidden.
  const admin = path.startsWith("/admin");

  return (
    <>
    <div className={`routebar${going ? " on" : ""}`} aria-hidden />
    <nav className={`topnav bleed${open ? " menu-open" : ""}${admin ? " admin-bar" : ""}${scrolled ? " scrolled" : ""}`} aria-label="Main">
      <Link href="/" className="logo" onClick={toTop("/")}>
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 3" />
          <path d="M16 16 L16 5 M16 16 L26 21 M16 16 L6 21" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>ADHZ</span>
        <small>Bike Repair &amp; Service</small>
      </Link>

      <button type="button" className="menubtn" aria-expanded={open} aria-controls="mainmenu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
        <span />
        <span />
        <span />
      </button>

      <div id="mainmenu" className="menu">
        <ul ref={listRef} onMouseLeave={() => setHover(null)}>
          <span className="slider" aria-hidden style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : { opacity: 0 }} />
          {LINKS.map((l, i) => (
            <li key={l.href}>
              <Link href={l.href} className={lit === i ? "lit" : ""} aria-current={path === l.href ? "page" : undefined} onClick={toTop(l.href)} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <a className="topcall" href="tel:+639693333473" aria-label="Call the shop">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      </a>
      <button type="button" className="menuscrim" tabIndex={-1} aria-hidden onClick={() => setOpen(false)} />
    </nav>
      {!admin && (
      <nav className="bottomnav" aria-label="Main (mobile)">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined} onClick={toTop(l.href)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={l.icon} />
            </svg>
            <span>{l.short}</span>
          </Link>
        ))}
      </nav>
      )}
    </>
  );
}
