import { readQr } from "@/lib/payment";

export const dynamic = "force-dynamic";

// Public: the shop's e-wallet QR code image, so customers can scan it.
export async function GET(_req: Request, ctx: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await ctx.params;
  const id = wallet.toLowerCase() === "maya" ? "Maya" : "GCash";
  const qr = readQr(id);
  if (!qr) return new Response("No QR code", { status: 404 });
  return new Response(new Uint8Array(qr.bytes), { headers: { "Content-Type": qr.type, "Cache-Control": "no-cache" } });
}
