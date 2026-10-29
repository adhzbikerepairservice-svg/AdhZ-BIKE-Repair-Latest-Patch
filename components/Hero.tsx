import Link from "next/link";
import HeroBike from "./HeroBike";
import Gear from "./Gear";

export default function Hero() {
  return (
    <header className="hero bleed">
      <Gear className="g1" />
      <Gear className="g2" />
      <span className="wm" aria-hidden>
        ADHZ
      </span>
      <div className="hero-copy">
        <span className="hero-loc">Balanga City, Bataan</span>
        <h1>
          Bike repair
          <br />
          <mark>&amp; service</mark>
        </h1>
        <span className="tagline">&ldquo;Healing bikes, one ride at a time.&rdquo;</span>
        <div className="cta">
          <Link className="btn" href="/book">Book a visit</Link>
          <Link className="btn outline" href="/services">See services</Link>
        </div>
      </div>
      <HeroBike />
    </header>
  );
}
