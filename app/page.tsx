import Link from "next/link";
import Finder from "@/components/Finder";
import Hero from "@/components/Hero";
import Quick from "@/components/Quick";
import ServiceRows from "@/components/ServiceRows";

const STEPS = [
  ["Pick a service", "Repair, service or build."],
  ["Choose a time", "Take a free slot."],
  ["Bring the bike in", "We confirm, then fix."],
];

export default function Home() {
  return (
    <>
      <Hero />
      <Quick />

      <section>
        <div className="sec-head">
          <div>
            <h2>What we do</h2>
          </div>
          <Link href="/services" className="more">View all services</Link>
        </div>
        <ServiceRows />
      </section>

      <section>
        <Finder />
      </section>

      <section>
        <div className="sec-head">
          <div>
            <h2>How it works</h2>
          </div>
        </div>
        <ol className="road">
          <li className="road-bike" aria-hidden />
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="node">{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

    </>
  );
}
