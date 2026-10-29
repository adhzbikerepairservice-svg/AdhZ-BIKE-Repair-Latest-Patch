import Link from "next/link";
import { ADDRESS } from "@/lib/maps";
import Gear from "./Gear";
import Socials from "./Socials";

export default function SiteFooter() {
  return (
    <>
      <footer className="sitefoot bleed">
        <Gear />
        <div>
          <b>ADHZ Bike Repair &amp; Service</b>
          <p>&ldquo;Healing bikes, one ride at a time.&rdquo;</p>
        </div>
        <div>
          <span className="eyebrow">Visit</span>
          <p>{ADDRESS}</p>
        </div>
        <div>
          <span className="eyebrow">Contact</span>
          <p>
            <a href="tel:+639693333473">0969 333 3473</a>
          </p>
          <Socials />
        </div>
      </footer>
      <div className="callbar">
        <a className="btn" href="tel:+639693333473">Call now</a>
        <Link className="btn gold" href="/book">Book a visit</Link>
      </div>
    </>
  );
}
