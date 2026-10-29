const TEETH = 12;

/** Decorative cog, echoing the gear on the shop banner. Colour comes from `currentColor`. */
export default function Gear({ className }: { className?: string }) {
  return (
    <svg className={`gear ${className ?? ""}`} viewBox="-100 -100 200 200" aria-hidden focusable="false">
      <defs>
        <mask id="gear-hole">
          <rect x={-100} y={-100} width={200} height={200} fill="#fff" />
          <circle r={30} fill="#000" />
        </mask>
      </defs>
      <g fill="currentColor" mask="url(#gear-hole)">
        <circle r={72} />
        {Array.from({ length: TEETH }, (_, i) => (
          <rect key={i} x={-13} y={-96} width={26} height={30} rx={5} transform={`rotate(${(360 / TEETH) * i})`} />
        ))}
      </g>
    </svg>
  );
}
