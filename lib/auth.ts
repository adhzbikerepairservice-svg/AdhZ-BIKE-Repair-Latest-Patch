import { sessionValid } from "./session";

// Shop-owner access, two ways (both send the credential in the x-owner-key header):
//  1. Gmail sign-in:  "session:<token>"  (see lib/session.ts)
//  2. Username and password: "user:password" (each part URL-encoded). Set SHOP_ADMIN_USER and SHOP_ADMIN_PASSWORD in .env.local.
// With neither configured, owner mode is disabled in production and open in development.
export function isOwner(req: Request): boolean {
  const header = req.headers.get("x-owner-key") ?? "";
  if (header.startsWith("session:")) return sessionValid(header.slice(8));
  const user = process.env.SHOP_ADMIN_USER;
  const pass = process.env.SHOP_ADMIN_PASSWORD;
  if (!user || !pass) return process.env.NODE_ENV !== "production" && !process.env.GMAIL_USER;
  const [u = "", p = ""] = header.split(":");
  try {
    return decodeURIComponent(u).toLowerCase() === user.toLowerCase() && decodeURIComponent(p) === pass;
  } catch {
    return false;
  }
}
