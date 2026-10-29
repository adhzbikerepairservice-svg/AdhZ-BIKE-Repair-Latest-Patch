import type { Metadata } from "next";
import ServiceTabs from "@/components/ServiceTabs";

export const metadata: Metadata = { title: "Services | ADHZ Bike Repair & Service" };

export default function ServicesPage() {
  return (
    <section>
      <div className="sec-head">
        <h1 className="pagetitle">Services</h1>
      </div>
      <ServiceTabs />
    </section>
  );
}
