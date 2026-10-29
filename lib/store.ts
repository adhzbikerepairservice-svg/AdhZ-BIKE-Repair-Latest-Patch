import { kvGet, kvSet } from "./db";
import { Inquiry, Slot, slotId } from "./shop";

// Bookings and slots. The working copy lives in memory for the length of a request; it is loaded from the database at the
// start of a request and written back after any request that changes it (see withStore), so it also works on serverless
// hosting where each request can run on a different server.
interface Store {
  slots: Map<string, Slot>;
  inquiries: Inquiry[];
}

export const store: Store = { slots: new Map(), inquiries: [] };

export async function loadStore() {
  const s = await kvGet<{ slots: [string, Slot][]; inquiries: Inquiry[] }>("shop");
  store.slots = new Map(s?.slots ?? []);
  store.inquiries = s?.inquiries ?? [];
}

export const saveStore = () => kvSet("shop", { slots: [...store.slots], inquiries: store.inquiries });

/** Wraps a route handler: loads the store first and, for handlers that change it, saves it after a successful reply. */
export const withStore =
  <A extends unknown[]>(fn: (...a: A) => Promise<Response>, opts: { save?: boolean } = {}) =>
  async (...a: A) => {
    await loadStore();
    const res = await fn(...a);
    if (opts.save && res.status < 400) await saveStore();
    return res;
  };

export { slotId };
