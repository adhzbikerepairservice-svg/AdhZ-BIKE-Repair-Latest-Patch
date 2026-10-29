// Customer <-> mechanic chat. In-memory like the rest of the store: survives hot reloads, resets on restart.
export interface ChatMessage {
  from: "customer" | "shop" | "ai";
  text: string;
  at: number;
}

export interface ChatThread {
  id: string;
  name: string;
  messages: ChatMessage[];
  unread: boolean; // true while the shop has not opened the latest customer message
}

interface ChatStore {
  threads: Map<string, ChatThread>;
  ownerSeen: number; // last time the owner dashboard was open (ms since epoch)
}

const g = globalThis as unknown as { __adhzChat2?: ChatStore };
const store = (g.__adhzChat2 ??= { threads: new Map(), ownerSeen: 0 });

export const threads = store.threads;

/** The mechanic counts as "away" when the dashboard has not been open for this long. */
export const AWAY_AFTER_MS = 60 * 1000;
export const markOwnerSeen = () => {
  store.ownerSeen = Date.now();
};
export const ownerAway = () => Date.now() - store.ownerSeen > AWAY_AFTER_MS;
