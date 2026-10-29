// Where the shop is, and the links that open it in a navigation app.
// For a pinpoint-accurate route, set COORDS from Google Maps (right-click the shop > copy the numbers).
export const ADDRESS = "Brgy. Camacho Cadre, Balanga City, Bataan";
export const ADDRESS_SHORT = "Brgy. Camacho Cadre, Balanga City";
const COORDS = null as { lat: number; lng: number } | null;

const place = COORDS ? `${COORDS.lat},${COORDS.lng}` : `${ADDRESS}, Philippines`;
const q = encodeURIComponent(place);

export const mapLinks = {
  /** Keyless Google Maps embed. */
  embed: `https://www.google.com/maps?q=${q}&z=16&output=embed`,
  /** Turn-by-turn directions from the visitor's current location. */
  google: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`,
  waze: COORDS ? `https://waze.com/ul?ll=${COORDS.lat},${COORDS.lng}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`,
  apple: `https://maps.apple.com/?daddr=${q}&dirflg=d`,
};

export const social = {
  shop: "https://www.facebook.com/profile.php?id=61585092517775",
  mechanic: "https://www.facebook.com/gueseadrian",
  whatsapp: "https://wa.me/639693333473",
  email: "adhzbikerepairservice@gmail.com",
};

/**
 * Where the shop is, used only to measure how far a visitor is. This is an APPROXIMATE point for Brgy. Camacho,
 * Balanga City; replace with the exact numbers from Google Maps (right-click the shop > copy coordinates).
 */
export const SHOP_POINT = { lat: 14.679, lng: 120.533 };

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
