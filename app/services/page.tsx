import type { Metadata } from "next";
import Services from "@/components/Services";

export const metadata: Metadata = { title: "Services | ADHZ Bike Repair & Service" };

export default function ServicesPage() {
  return (
    <section>
      <div className="sec-head">
        <h1 className="pagetitle">Services</h1>
      </div>
      <Services />
    </section>
  );
}
