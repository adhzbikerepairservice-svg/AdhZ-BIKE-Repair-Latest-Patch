import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { store } from "@/lib/store";
import { getMech, HOURS, isClosed, parseDate, slotId, SHOP, ymd } from "@/lib/shop";

export const dynamic = "force-dynamic";

// Public: current availability from today onward.
export async function GET() {
  const today = ymd(new Date());
  const slots = [...store.slots.entries()].filter(([, s]) => s.date >= today);
  return NextResponse.json({ slots });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Owner:
//  - { action: "block" | "release", from, to, hours? } blocks or reopens every selected hour on every working day in the range.
//    Booked slots (pending/confirmed) are never touched; the reply says how many were skipped.
//  - { date, mech, hour } (older) toggles one slot, used by the shop view on the booking page.
export async function POST(req: Request) {
  if (!isOwner(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();

  if (body.action === "block" || body.action === "release") {
    const { from, to } = body;
    if (typeof from !== "string" || typeof to !== "string" || !DATE.test(from) || !DATE.test(to) || to < from) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const hours: number[] = Array.isArray(body.hours) && body.hours.length ? body.hours.filter((h: number) => HOURS.includes(h)) : HOURS;
    let changed = 0;
    let skipped = 0;
    const end = parseDate(to);
    for (let d = parseDate(from), n = 0; d <= end && n < 400; d.setDate(d.getDate() + 1), n++) {
      const date = ymd(d);
      for (const m of SHOP.mechanics) {
        if (!m.days.includes(d.getDay()) || isClosed(d)) continue;
        for (const hour of hours) {
          const id = slotId(date, m.id, hour);
          const cur = store.slots.get(id);
          if (body.action === "block") {
            if (!cur) {
              store.slots.set(id, { date, mech: m.id, hour, status: "blocked" });
              changed++;
            } else if (cur.status !== "blocked") skipped++;
          } else if (cur?.status === "blocked") {
            store.slots.delete(id);
            changed++;
          }
        }
      }
    }
    return NextResponse.json({ ok: true, changed, skipped });
  }

  const { date, mech, hour } = body;
  if (typeof date !== "string" || !getMech(mech) || !HOURS.includes(hour)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const id = slotId(date, mech, hour);
  const cur = store.slots.get(id);
  if (!cur) store.slots.set(id, { date, mech, hour, status: "blocked" });
  else if (cur.status === "blocked") store.slots.delete(id);
  return NextResponse.json({ ok: true });
}
