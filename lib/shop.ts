// ---- Shop settings: edit these to match the real shop ----
export interface Mechanic {
  id: string;
  name: string;
  role: string;
  days: number[];
}

export interface Service {
  id: string;
  name: string;
  blurb: string;
  items: string[];
}

export const SHOP = {
  open: 9,
  close: 17,
  lunch: 12, // visit slots start on the hour, lunch hour skipped
  closedDays: [0], // 0 = Sunday
  horizonDays: 120, // how far ahead visitors can book
  mechanics: [
    { id: "adrian", name: "Adrian S. Guese", role: "Bike repair, service and builds", days: [1, 2, 3, 4, 5, 6] },
  ] satisfies Mechanic[],
  services: [
    {
      id: "repair", name: "Bike repair", blurb: "Brake bleeding and tubeless set-ups, done right.",
      items: [
        "Brake bleeding (regular)",
        "Brake bleeding w/o oil",
        "Brake bleeding w/ oil",
        "Tubeless set-up (per wheel)",
      ],
    },
    {
      id: "service", name: "Full service", blurb: "Wash, tune up or a full bike spa for hardtails and suspension bikes.",
      items: [
        "Bike wash w/ tune up",
        "Bike spa (hardtail)",
        "Bike spa (suspension)",
      ],
    },
    {
      id: "build", name: "Bike building", blurb: "Full bike builds, wheel builds, dropper posts and internal routing.",
      items: [
        "Bike build w/o wheel build",
        "Wheel build (one set)",
        "Wheel build (two sets)",
        "Internal routing",
        "Dropper installation",
      ],
    },
  ] satisfies Service[],
};

// ---- Shared types ----
export type SlotStatus = "pending" | "confirmed" | "blocked";
export type InquiryStatus = "pending" | "confirmed" | "declined" | "done";

export interface Slot {
  date: string;
  mech: string;
  hour: number;
  status: SlotStatus;
}

export interface Inquiry {
  id: string;
  name: string;
  contact: string;
  payNow?: boolean; // e-wallet customers who chose to send a deposit right after booking
  advance?: { amount: number; wallet: string; ref: string; status: "submitted" | "confirmed"; at: number };
  payPref: "cash" | "ewallet"; // how the customer says they will pay
  email: string; // customer's Gmail/email, used to send the receipt
  service: string;
  bike: string;
  brand: string;
  notes: string;
  handover: "bring" | "collect"; // "bring": customer drops off and picks up at the shop; "collect": shop picks up from and delivers back to the customer (extra fee)
  address: string; // customer address for pick-up and delivery (only when handover is "collect")
  pickup: string; // day the customer wants the finished bike back (YYYY-MM-DD), empty = call when ready
  date: string;
  mech: string;
  hour: number;
  slot: string;
  status: InquiryStatus;
  createdAt: number;
  // filled in when the job is marked done
  receipt?: { no: string; lines: { label: string; amount: number }[]; total: number; advance?: number; refund?: number; note: string; payment: "cash" | "ewallet"; payRef: string; payStatus?: "unpaid" | "submitted" | "paid"; wallet?: string; doneAt: number; emailed: boolean; emailError?: string };
}

export type NewInquiry = Omit<Inquiry, "id" | "slot" | "status" | "createdAt">;

export type CellState = "open" | "pending" | "booked" | "blocked" | "off" | "past";

// ---- Helpers ----
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? "AM" : "PM"}`;
export const dayLong = (s: string) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
export const slotId = (date: string, mech: string, hour: number) => `${date}_${mech}_${hour}`;
export const getMech = (id: string) => SHOP.mechanics.find((m) => m.id === id);
export const getService = (id: string) => SHOP.services.find((s) => s.id === id);
export const isClosed = (d: Date) => SHOP.closedDays.includes(d.getDay());

export const HOURS: number[] = [];
for (let h = SHOP.open; h < SHOP.close; h++) if (h !== SHOP.lunch) HOURS.push(h);

export function buildDates(): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < SHOP.horizonDays; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

export function cellState(slots: Map<string, Slot>, date: string, m: Mechanic, h: number): CellState {
  const d = parseDate(date);
  if (!m.days.includes(d.getDay()) || isClosed(d)) return "off";
  const now = new Date();
  if (ymd(now) === date && h <= now.getHours()) return "past";
  const s = slots.get(slotId(date, m.id, h));
  if (s) return s.status === "pending" ? "pending" : s.status === "blocked" ? "blocked" : "booked";
  return "open";
}
