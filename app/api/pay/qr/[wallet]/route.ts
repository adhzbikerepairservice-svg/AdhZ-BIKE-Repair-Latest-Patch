import { readQr, STATIC_QR } from "@/lib/payment";

export const dynamic = "force-dynamic";

// Public: the shop's e-wallet QR code image, so customers can scan it.
export async function GET(_req: Request, ctx: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await ctx.params;
  const id = wallet.toLowerCase() === "maya" ? "Maya" : "GCash";
  const qr = readQr(id);
  if (!qr) {
    const shipped = STATIC_QR[id];
    return shipped ? Response.redirect(new URL(shipped, _req.url), 307) : new Response("No QR code", { status: 404 });
  }
  return new Response(new Uint8Array(qr.bytes), { headers: { "Content-Type": qr.type, "Cache-Control": "no-cache" } });
}
