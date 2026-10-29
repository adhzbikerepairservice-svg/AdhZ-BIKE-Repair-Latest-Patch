import type { Metadata } from "next";
import BikeShop from "@/components/BikeShop";
import { getService } from "@/lib/shop";

export const metadata: Metadata = { title: "Book a visit | ADHZ Bike Repair & Service" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string | string[]; item?: string | string[] }> }) {
  const { service, item } = await searchParams;
  const id = typeof service === "string" && getService(service) ? service : "";
  const wanted = typeof item === "string" ? item.slice(0, 80) : "";
  return <BikeShop initialService={id} initialItem={wanted} />;
}
