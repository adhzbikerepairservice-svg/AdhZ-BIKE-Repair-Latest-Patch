import type { Metadata } from "next";
import MapCard from "@/components/MapCard";
import { social } from "@/lib/maps";

export const metadata: Metadata = { title: "Contact | ADHZ Bike Repair & Service" };

const i = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const WEEK = [
  ["Monday", "9:00 AM to 5:00 PM"],
  ["Tuesday", "9:00 AM to 5:00 PM"],
  ["Wednesday", "9:00 AM to 5:00 PM"],
  ["Thursday", "9:00 AM to 5:00 PM"],
  ["Friday", "9:00 AM to 5:00 PM"],
  ["Saturday", "9:00 AM to 5:00 PM"],
  ["Sunday", "Closed"],
];

export default function ContactPage() {
  return (
    <section>
      <div className="sec-head">
        <h1 className="pagetitle">Contact</h1>
      </div>

      <div className="contactwrap">
        <div className="reach">
          <a className="reach-row" href="tel:+639693333473">
            <span className="qicon"><svg {...i}><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg></span>
            <span><small>Call or text</small><b>0969 333 3473</b></span>
          </a>
          <a className="reach-row" href={social.whatsapp} target="_blank" rel="noreferrer">
            <span className="qicon wa"><svg {...i}><path d="M12 3.500a8.500 8.500 0 0 0-7.300 12.800L3.500 20.500l4.300-1.100A8.500 8.500 0 1 0 12 3.500z" /></svg></span>
            <span><small>WhatsApp</small><b>+63 969 333 3473</b></span>
          </a>
          <a className="reach-row" href={`mailto:${social.email}`}>
            <span className="qicon"><svg {...i}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
            <span><small>Email</small><b>{social.email.replace("@", "@​")}</b></span>
          </a>
          <a className="reach-row" href={social.shop} target="_blank" rel="noreferrer">
            <span className="qicon fb"><svg {...i}><path d="M14 8h2V4h-3a4 4 0 0 0-4 4v3H7v4h2v6h4v-6h3l1-4h-4V8.500A.5.500 0 0 1 14 8z" /></svg></span>
            <span><small>Facebook page</small><b>ADHZ Bike Repair &amp; Service</b></span>
          </a>
          <a className="reach-row" href={social.mechanic} target="_blank" rel="noreferrer">
            <span className="qicon fb"><svg {...i}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span>
            <span><small>Your mechanic</small><b>Adrian S. Guese</b></span>
          </a>
        </div>

        <div className="panel hoursbox">
          <h3>Opening hours</h3>
          <ul>
            {WEEK.map(([d, h]) => (
              <li key={d} className={h === "Closed" ? "closed" : ""}>
                <span>{d}</span>
                <b>{h}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <MapCard />
    </section>
  );
}
