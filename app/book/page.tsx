import type { Metadata } from "next";
import BikeShop from "@/components/BikeShop";
import { getService } from "@/lib/shop";

export const metadata: Metadata = { title: "Book a visit | ADHZ Bike Repair & Service" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const { service } = await searchParams;
  const id = typeof service === "string" && getService(service) ? service : "";
  return <BikeShop initialService={id} />;
}
