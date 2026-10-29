import { ChatMessage } from "./chat";
import { ADDRESS } from "./maps";
import { SHOP } from "./shop";

/** Facts the assistant may use. Nothing here is invented: prices are deliberately not included. */
function shopFacts() {
  const services = SHOP.services.map((s) => `- ${s.name}: ${s.items.join("; ")}`).join("\n");
  return `Shop: ADHZ Bike Repair & Service ("Healing bikes, one ride at a time.")
Mechanic and owner: Adrian S. Guese
Address: ${ADDRESS}
Hours: Monday to Saturday, 9:00 AM to 5:00 PM, closed Sundays (visit slots are one hour, lunch 12 to 1 PM is not bookable)
Phone / WhatsApp: 0969 333 3473
Booking: customers book on the website page /book (pick a service, a time, then their details).
Drop-off options: customers can bring the bike to the shop and pick it up themselves (no extra fee), or ask for home pick-up and delivery by the mechanic's dad (extra fee that depends on distance; the amount is confirmed by phone).
Services:
${services}`;
}

const SYSTEM = () => `You are the friendly chat assistant for a small bike shop, replying while the mechanic is away from the website.
Rules:
- Reply in the customer's language (English or Filipino/Taglish), in 1 to 3 short sentences.
- Use only the shop facts below. If you do not know something (especially PRICES, parts availability or diagnosis), say Adrian will confirm it and ask for details (bike type, the problem, phone number).
- Never invent prices, discounts, or promises. Never claim to be Adrian; say you are the shop's assistant and that Adrian will reply when he is back.
- Encourage booking at /book when it fits. Be warm and helpful.

${shopFacts()}`;

/** Keyword fallback used when no AI key is configured or the AI call fails. */
function fallbackReply(last: string, first: boolean): string {
  const t = last.toLowerCase();
  if (/\b(open|hour|time|oras|sara|bukas)\b/.test(t)) return "We are open Monday to Saturday, 9:00 AM to 5:00 PM, and closed on Sundays.";
  if (/\b(where|address|location|saan|map|direction)\b/.test(t)) return `You can find us at ${ADDRESS}. The map and Waze links are on our Contact page.`;
  if (/(price|how much|magkano|cost|rate|fee)/.test(t)) return "Adrian will confirm the price once he sees the bike. Tell me what your bike needs and your phone number, and he will get back to you.";
  if (/(deliver|pick ?up|collect|sundo|hatid)/.test(t)) return "You can bring the bike to the shop yourself at no extra fee, or ask for home pick-up and delivery for an extra fee that depends on distance. You can choose this when you book.";
  if (/(book|appointment|schedule|slot|reserve)/.test(t)) return "You can book a time anytime on our Book a visit page: pick a service, choose a free slot, and send your details.";
  if (/(brake|tubeless|tire|tyre|flat|bleed)/.test(t)) return "That sounds like our Bike repair service (brake bleeding, tubeless set-up). Adrian will confirm once he sees it. Want to book a time?";
  if (/(build|wheel|dropper|routing|assemble|frame)/.test(t)) return "That falls under Bike building (full builds, wheel builds, dropper installation, internal routing). Tell me more and Adrian will follow up.";
  if (/(wash|tune|spa|service|clean|chain|gear)/.test(t)) return "Our Full service covers bike wash with tune-up and the bike spa for hardtail or suspension bikes. Want to book one?";
  return first
    ? "Hi! I'm the shop's assistant. Adrian is away from the website right now, but I can help. Tell me about your bike and what it needs, and leave your phone number so he can follow up."
    : "Thanks! I've passed this on. Adrian will reply here as soon as he is back. Is there anything else I can help with?";
}

/** Ask Claude for a reply; falls back to keyword answers without an API key or on any error. */
export async function assistantReply(history: ChatMessage[]): Promise<string> {
  const last = [...history].reverse().find((m) => m.from === "customer")?.text ?? "";
  const first = history.filter((m) => m.from !== "customer").length === 0;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackReply(last, first);

  // Claude expects alternating user/assistant turns starting with a user turn.
  const turns: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history.slice(-20)) {
    const role = m.from === "customer" ? "user" : "assistant";
    const prev = turns[turns.length - 1];
    if (prev && prev.role === role) prev.content += "\n" + m.text;
    else turns.push({ role, content: m.text });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length) return fallbackReply(last, first);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 220, system: SYSTEM(), messages: turns }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const text = data?.content?.find((c: { type: string }) => c.type === "text")?.text?.trim();
    return text || fallbackReply(last, first);
  } catch {
    return fallbackReply(last, first);
  }
}
