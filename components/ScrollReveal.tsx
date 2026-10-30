"use client";

import { useEffect } from "react";

// Blocks that fade up (staggered) the first time they scroll into view.
const TARGETS = ".sec-head, .tile, .qcard, .road li:not(.road-bike), .svccard, .mapcard, .reach, .hoursbox, .ctaband, .showband, .diag, .slides, .book .panel";

/**
 * Tags matching elements with `.reveal` and adds `.in` when they enter the viewport. Elements are
 * tagged from JS, so without JS everything simply stays visible.
 * A MutationObserver picks up content that renders later (schedule, route changes).
 */
export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    const seen = new WeakSet<Element>();
    const tag = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches(TARGETS)) : [];
        el.style.setProperty("--d", `${Math.max(siblings.indexOf(el), 0) * 90}ms`);
        el.classList.add("reveal");
        io.observe(el);
      });
    };

    const main = document.querySelector("main");
    if (!main) return;
    tag(main);
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof HTMLElement && (n.matches(TARGETS) && tag(n.parentElement ?? main), tag(n)));
    });
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
