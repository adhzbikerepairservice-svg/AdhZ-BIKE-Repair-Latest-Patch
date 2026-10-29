"use client";

import { useEffect, useRef, useState } from "react";
import { WORKS } from "@/lib/showcase";
import { social } from "@/lib/maps";

const DELAY = 5000;

/** Auto-playing slideshow of finished jobs: pauses on hover/touch, dots to jump, swipe on phones. */
export default function Slideshow() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(0);
  const n = WORKS.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), DELAY);
    return () => clearInterval(t);
  }, [n, paused]);

  if (!n) {
    return (
      <div className="slides empty-slides">
        <b>Finished jobs are coming soon</b>
        <p>See our latest work on Facebook while we add photos here.</p>
        <a className="btn" href={social.shop} target="_blank" rel="noreferrer">
          Open Facebook page
        </a>
      </div>
    );
  }

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <div
      className="slides"
      role="region"
      aria-roledescription="carousel"
      aria-label="Finished work"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touch.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setPaused(false);
      }}
    >
      <div className="slides-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {WORKS.map((w, k) => (
          <figure key={w.src} className="slide" aria-hidden={k !== i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.src} alt={w.title} loading={k === 0 ? "eager" : "lazy"} />
            <figcaption>
              <span>{w.service}</span>
              <b>{w.title}</b>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="slides-dots" role="tablist" aria-label="Choose a photo">
        {WORKS.map((w, k) => (
          <button key={w.src} type="button" role="tab" aria-selected={k === i} aria-label={w.title} onClick={() => setI(k)} />
        ))}
      </div>
    </div>
  );
}
