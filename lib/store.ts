import { Inquiry, Slot, slotId } from "./shop";

// In-memory store. Survives hot reloads in dev, resets on server restart.
// Swap this module for a real database to persist bookings.
interface Store {
  slots: Map<string, Slot>;
  inquiries: Inquiry[];
}

const g = globalThis as unknown as { __adhz?: Store };
export const store: Store = (g.__adhz ??= { slots: new Map(), inquiries: [] });

export { slotId };
