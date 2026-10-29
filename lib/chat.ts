import { kvGet, kvSet } from "./db";

// Customer <-> mechanic chat. Loaded from the database at the start of a request and saved after changes (see loadChat).
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

export const threads = new Map<string, ChatThread>();
let ownerSeen = 0; // last time the owner dashboard was open (ms since epoch)

export async function loadChat() {
  const [list, seen] = await Promise.all([kvGet<ChatThread[]>("chat"), kvGet<number>("chat_seen")]);
  threads.clear();
  for (const t of list ?? []) threads.set(t.id, t);
  ownerSeen = seen ?? 0;
}

export const saveChat = () => kvSet("chat", [...threads.values()]);

/** The mechanic counts as "away" when the dashboard has not been open for this long. */
export const AWAY_AFTER_MS = 60 * 1000;
export const markOwnerSeen = async () => {
  ownerSeen = Date.now();
  await kvSet("chat_seen", ownerSeen);
};
export const ownerAway = () => Date.now() - ownerSeen > AWAY_AFTER_MS;
