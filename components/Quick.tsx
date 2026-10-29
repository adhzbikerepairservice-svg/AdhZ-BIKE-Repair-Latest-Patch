import Link from "next/link";
import { ADDRESS_SHORT } from "@/lib/maps";

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export default function Quick() {
  return (
    <div className="quick">
      <a className="qcard" href="tel:+639693333473">
        <span className="qicon">
          <svg {...icon}><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
        </span>
        <span>
          <small>Call or text</small>
          <b>0969 333 3473</b>
          <em>Tap to call</em>
        </span>
      </a>
      <Link className="qcard" href="/contact#map">
        <span className="qicon">
          <svg {...icon}><path d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z" /><circle cx="12" cy="9" r="2.500" /></svg>
        </span>
        <span>
          <small>Find us</small>
          <b>{ADDRESS_SHORT}</b>
          <em>Get directions</em>
        </span>
      </Link>
      <div className="qcard">
        <span className="qicon">
          <svg {...icon}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </span>
        <span>
          <small>Hours</small>
          <b>Mon to Sat, 9 AM to 5 PM</b>
          <em>Closed Sundays</em>
        </span>
      </div>
    </div>
  );
}
