import { readQr, STATIC_QR } from "@/lib/payment";

export const dynamic = "force-dynamic";

// Public: the shop's e-wallet QR code image, so customers can scan it.
export async function GET(_req: Request, ctx: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await ctx.params;
  const id = wallet.toLowerCase() === "maya" ? "Maya" : "GCash";
  const qr = await readQr(id);
  if (!qr) {
    const shipped = STATIC_QR[id];
    return shipped ? new Response(null, { status: 307, headers: { Location: shipped } }) /* relative, so it works from any address (a phone on the same Wi-Fi, the live site) */ : new Response("No QR code", { status: 404 });
  }
  return new Response(new Uint8Array(qr.bytes), { headers: { "Content-Type": qr.type, "Cache-Control": "no-cache" } });
}
