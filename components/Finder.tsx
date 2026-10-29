"use client";

import Link from "next/link";
import { useState } from "react";
import { getService } from "@/lib/shop";

const SYMPTOMS = [
  { label: "Brakes feel weak or spongy", service: "repair", item: "Brake bleeding" },
  { label: "Tubeless tyre keeps losing air", service: "repair", item: "Tubeless set-up" },
  { label: "Chain is noisy and gears skip", service: "service", item: "Bike wash with tune up" },
  { label: "It's been a long time since a proper check", service: "service", item: "Bike spa" },
  { label: "I have a frame and parts to assemble", service: "build", item: "Full bike build" },
  { label: "I want a dropper post or hidden cables", service: "build", item: "Dropper or internal routing" },
];

/** "Not sure what you need?" helper: pick what the bike is doing, get the matching service and a Book link. */
export default function Finder() {
  const [pick, setPick] = useState<number | null>(null);
  const OTHERS = SYMPTOMS.length;
  const hit = pick === null || pick === OTHERS ? null : SYMPTOMS[pick];
  const svc = hit ? getService(hit.service) : null;

  return (
    <div className="finder">
      <div className="finder-ask">
        <h2>Not sure what your bike needs?</h2>
        <p>Tell us what it&apos;s doing and we&apos;ll point you to the right service.</p>
        <div className="finder-chips" role="radiogroup" aria-label="What is your bike doing?">
          {SYMPTOMS.map((s, i) => (
            <button key={s.label} type="button" role="radio" aria-checked={pick === i} onClick={() => setPick(i)}>
              {s.label}
            </button>
          ))}
          <button type="button" role="radio" aria-checked={pick === OTHERS} onClick={() => setPick(OTHERS)}>
            Others
          </button>
        </div>
      </div>
      <div className="finder-result" aria-live="polite">
        {hit && svc ? (
          <div key={pick} className="finder-card">
            <span className="eyebrow">We suggest</span>
            <h3>{svc.name}</h3>
            <p>
              Start with <b>{hit.item}</b>. Adrian will confirm once he sees the bike.
            </p>
            <Link className="btn" href={`/book?service=${hit.service}`}>
              Book {svc.name.toLowerCase()}
            </Link>
          </div>
        ) : pick === OTHERS ? (
          <div key="others" className="finder-card">
            <span className="eyebrow">Something else?</span>
            <h3>Chat with Adrian</h3>
            <p>Describe the problem and he will reply with what your bike needs.</p>
            <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("open-chat"))}>
              Start chat
            </button>
          </div>
        ) : (
          <div className="finder-card idle">
            <span className="eyebrow">Your match</span>
            <p>Pick one on the left and your suggested service shows up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
