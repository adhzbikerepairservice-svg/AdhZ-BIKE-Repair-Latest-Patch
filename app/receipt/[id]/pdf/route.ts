import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { ADDRESS } from "@/lib/maps";
import { payStatusOf } from "@/lib/payment";
import { dayLong, getMech, getService, hourLabel } from "@/lib/shop";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Real PDF download of a receipt (the link contains the receipt's unguessable id).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const i = store.inquiries.find((x) => x.id === id);
  if (!i?.receipt) return new Response("Not found", { status: 404 });
  const r = i.receipt;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.122, 0.322, 0.769);
  const gold = rgb(0.949, 0.725, 0.133);
  const green = rgb(0.078, 0.424, 0.231);
  const ink = rgb(0.118, 0.169, 0.322);
  const muted = rgb(0.357, 0.4, 0.533);
  const line = rgb(0.835, 0.86, 0.94);
  const paper = rgb(0.969, 0.973, 0.988);
  const soft = rgb(0.855, 0.918, 0.984);
  const white = rgb(1, 1, 1);
  const W = 595;
  const H = 842;
  const M = 44;
  // The standard PDF fonts have no peso sign, so amounts are written as PHP.
  const money = (n: number) => "PHP " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clean = (t: string) => t.replace(/[^\x20-\x7e]/g, "?");
  const wid = (t: string, size: number, f = font) => f.widthOfTextAtSize(clean(t), size);
  const text = (t: string, x: number, y: number, size = 11, f = font, color = ink) => page.drawText(clean(t), { x, y, size, font: f, color });
  const right = (t: string, xr: number, y: number, size = 11, f = font, color = ink) => text(t, xr - wid(t, size, f), y, size, f, color);
  const fit = (t: string, max: number, size: number, f = font) => {
    let s = t;
    while (s.length > 3 && wid(s, size, f) > max) s = s.slice(0, -2);
    return s === t ? t : s + "...";
  };

  // header band
  page.drawRectangle({ x: 0, y: H - 112, width: W, height: 112, color: blue });
  page.drawRectangle({ x: 0, y: H - 117, width: W, height: 5, color: gold });
  page.drawCircle({ x: M + 16, y: H - 56, size: 15, borderColor: white, borderWidth: 3, color: undefined });
  text("ADHZ", M + 42, H - 54, 26, bold, white);
  text("BIKE REPAIR & SERVICE", M + 42, H - 72, 8.5, font, soft);
  right("RECEIPT", W - M, H - 44, 9, bold, soft);
  right(r.no, W - M, H - 66, 17, bold, white);

  // three info columns
  const col = [M, M + 175, M + 350];
  const label = (t: string, x: number, y: number) => text(t.toUpperCase(), x, y, 7.5, bold, muted);
  let y = H - 150;
  label("Billed to", col[0], y);
  text(fit(i.name, 160, 11, bold), col[0], y - 16, 11, bold);
  text(fit(i.email, 160, 9.5), col[0], y - 31, 9.5, font, muted);
  text(fit(i.contact, 160, 9.5), col[0], y - 44, 9.5, font, muted);
  label("From", col[1], y);
  text("ADHZ Bike Repair & Service", col[1], y - 16, 11, bold);
  text(fit(ADDRESS, 165, 9), col[1], y - 31, 9, font, muted);
  text("0969 333 3473", col[1], y - 44, 9.5, font, muted);
  label("Issued", col[2], y);
  text(new Date(r.doneAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }), col[2], y - 16, 11, bold);
  label("Payment", col[2], y - 36);
  text(fit(r.payment === "ewallet" ? "E-wallet" + (r.payRef ? ` (ref ${r.payRef})` : "") : "Cash", 160, 11, bold), col[2], y - 52, 11, bold);

  // job strip
  y -= 82;
  page.drawRectangle({ x: M, y: y - 38, width: W - 2 * M, height: 50, color: paper });
  const job: [string, string][] = [
    ["Service", getService(i.service)?.name ?? i.service],
    ["Bike", i.bike + (i.brand ? ` (${i.brand})` : "")],
    ["Visit", `${dayLong(i.date)}, ${hourLabel(i.hour)}`],
    ["Mechanic", getMech(i.mech)?.name ?? ""],
  ];
  const cw = (W - 2 * M - 24) / 4;
  job.forEach(([k, v], n) => {
    label(k, M + 12 + n * cw, y);
    text(fit(v, cw - 8, 9.5, bold), M + 12 + n * cw, y - 16, 9.5, bold);
  });

  // table
  y -= 70;
  page.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 24, color: paper });
  text("DESCRIPTION", M + 10, y, 8, bold, muted);
  right("AMOUNT", W - M - 10, y, 8, bold, muted);
  y -= 32;
  for (const l of r.lines) {
    text(fit(l.label, 380, 11), M + 10, y, 11);
    right(money(l.amount), W - M - 10, y, 11);
    page.drawLine({ start: { x: M, y: y - 10 }, end: { x: W - M, y: y - 10 }, thickness: 0.6, color: line });
    y -= 30;
  }

  // total + PAID stamp
  y -= 14;
  page.drawRectangle({ x: W - M - 230, y: y - 18, width: 230, height: 42, color: soft });
  const status = payStatusOf(r);
  const adv = r.advance ?? 0;
  if (adv > 0) {
    text("Total " + money(r.total) + "   Deposit paid -" + money(adv), M + 110, y + 6, 9, font, muted);
  }
  text(status === "paid" ? "TOTAL PAID" : "BALANCE DUE", W - M - 218, y - 2, 8.5, bold, muted);
  right(money(status === "paid" ? r.total : Math.max(0, r.total - adv)), W - M - 12, y - 4, 17, bold, blue);
  page.drawText(status === "paid" ? "PAID" : status === "submitted" ? "CHECKING" : "UNPAID", { x: M + 8, y: y - 12, size: status === "paid" ? 26 : 20, font: bold, color: status === "paid" ? green : rgb(0.76, 0.4, 0.05), rotate: degrees(6) });
  page.drawRectangle({ x: M, y: y - 22, width: 92, height: 42, borderColor: green, borderWidth: 2.5, rotate: degrees(6), opacity: 0, borderOpacity: 0.9 });
  y -= 56;

  if (r.note) {
    page.drawRectangle({ x: M, y: y - 8, width: 3, height: 26, color: gold });
    text(fit(r.note, W - 2 * M - 20, 10), M + 12, y + 2, 10, font, ink);
    y -= 40;
  }

  // footer band
  page.drawRectangle({ x: 0, y: 0, width: W, height: 74, color: paper });
  page.drawLine({ start: { x: 0, y: 74 }, end: { x: W, y: 74 }, thickness: 0.8, color: line });
  const t1 = "Thank you for choosing ADHZ. Healing bikes, one ride at a time.";
  text(t1, (W - wid(t1, 10.5, bold)) / 2, 46, 10.5, bold, ink);
  const t2 = "Brgy. Camacho Cadre, Balanga City, Bataan  |  0969 333 3473  |  Valid without a signature";
  text(t2, (W - wid(t2, 8.5)) / 2, 30, 8.5, font, muted);

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${r.no}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
