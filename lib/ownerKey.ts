/** Credential string the browser sends to the API (see lib/auth.ts). */
export const ownerKeyOf = (user: string, password: string) => encodeURIComponent(user.trim()) + ":" + encodeURIComponent(password);
export const OWNER_STORAGE_KEY = "adhz-owner-key";
