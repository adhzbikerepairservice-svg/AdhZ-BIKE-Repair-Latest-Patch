import { social } from "@/lib/maps";

const FB = "M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.900 1.400-3.900 4v2.200H8v3h2.500V21z";

const WA = "M12 3.500a8.500 8.500 0 0 0-7.300 12.800L3.500 20.500l4.300-1.100A8.500 8.500 0 1 0 12 3.500zm4.800 11.700c-.2.600-1.200 1.100-1.700 1.200-.4.100-1 .1-1.600-.1-.4-.1-.9-.3-1.500-.6-2.600-1.100-4.300-3.700-4.400-3.900-.1-.2-1-1.300-1-2.500s.6-1.800.9-2c.2-.2.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 1.900c.1.100.1.300 0 .5l-.3.400-.3.400c-.1.100-.3.300-.1.600.2.300.7 1.100 1.500 1.800 1 .9 1.800 1.100 2.100 1.300.3.100.4.100.6-.1l.8-1c.2-.3.400-.2.600-.1l1.800.9c.3.100.5.200.5.300.1.200.1.700-.1 1.300z";

/** Facebook and WhatsApp links for the shop page and the mechanic's own page. */
export default function Socials({ className = "" }: { className?: string }) {
  const items = [
    { href: social.whatsapp, label: "WhatsApp +63 969 333 3473", wa: true },
    { href: social.shop, label: "ADHZ on Facebook" },
    { href: social.mechanic, label: "Adrian S. Guese on Facebook" },
  ];
  return (
    <div className={`socials ${className}`}>
      {items.map((i) => (
        <a key={i.href} href={i.href} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d={i.wa ? WA : FB} />
          </svg>
          {i.label}
        </a>
      ))}
    </div>
  );
}
