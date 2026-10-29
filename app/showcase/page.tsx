import type { Metadata } from "next";
import Slideshow from "@/components/Slideshow";
import { social } from "@/lib/maps";

export const metadata: Metadata = { title: "Showcase | ADHZ Bike Repair & Service" };

export default function ShowcasePage() {
  return (
    <section>
      <div className="sec-head">
        <h1 className="pagetitle">Our work</h1>
        <a className="btn outline" href={social.shop} target="_blank" rel="noreferrer">
          More on Facebook
        </a>
      </div>
      <Slideshow />
    </section>
  );
}
