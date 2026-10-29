import Image from "next/image";

// The product photo is 1597 x 1200. Wheel centres/radii were measured from it; each wheel
// gets a rotating copy of its own tyre ring (cropped from the same photo) plus a layer of
// spoke lines, so the bike rolls while the frame, fork and drivetrain stay still.
const PHOTO = { w: 1597, h: 1200 };
const WHEELS = [
  // `hole` = angle range (degrees, 0 = 3 o'clock, clockwise) where frame parts cross the tyre.
  // Those parts are left out of the rotating copy so they never appear to orbit the wheel.
  { id: "rear", cx: 298, cy: 738, r: 283, hole: [-35, 55] },
  { id: "front", cx: 1283, cy: 744, r: 286, hole: [-135, -95] },
];

/** objectBoundingBox clip path: the whole square minus a wedge (even-odd fill). */
function clipPath([from, to]: number[]) {
  const pts = ["0.5 0.5"];
  for (let a = from; a <= to; a += 5) {
    const t = (a * Math.PI) / 180;
    pts.push(`${(0.5 + 0.75 * Math.cos(t)).toFixed(3)} ${(0.5 + 0.75 * Math.sin(t)).toFixed(3)}`);
  }
  return `M0 0H1V1H0Z M${pts.join(" L")}Z`;
}
const SPOKES = Array.from({ length: 32 }, (_, i) => (i * Math.PI * 2) / 32);

export default function HeroBike() {
  return (
    <div className="hero-bike">
      <svg width="0" height="0" className="clip-defs" aria-hidden focusable="false">
        <defs>
          {WHEELS.map(({ id, hole }) => (
            <clipPath key={id} id={`clip-${id}`} clipPathUnits="objectBoundingBox">
              <path d={clipPath(hole)} clipRule="evenodd" />
            </clipPath>
          ))}
        </defs>
      </svg>
      <Image src="/hero-bike.png" alt="Full-suspension mountain bike" width={PHOTO.w} height={PHOTO.h} sizes="(max-width: 900px) 90vw, 50vw" priority />
      {WHEELS.map(({ id, cx, cy, r }) => (
        <span
          key={id}
          className="wheel"
          aria-hidden
          style={
            {
              "--x": `${((cx - r) / PHOTO.w) * 100}%`,
              "--y": `${((cy - r) / PHOTO.h) * 100}%`,
              "--s": `${((2 * r) / PHOTO.w) * 100}%`,
              "--bs": `${(PHOTO.w / (2 * r)) * 100}%`,
              "--bx": `${((cx - r) / (PHOTO.w - 2 * r)) * 100}%`,
              "--by": `${((cy - r) / (PHOTO.h - 2 * r)) * 100}%`,
            } as React.CSSProperties
          }
        >
          <i className="tyre" style={{ clipPath: `url(#clip-${id})` }} />
          <svg viewBox="-100 -100 200 200" className="spokes">
            {SPOKES.map((a) => (
              <line key={a} x1={16 * Math.cos(a)} y1={16 * Math.sin(a)} x2={78 * Math.cos(a)} y2={78 * Math.sin(a)} />
            ))}
          </svg>
        </span>
      ))}
      {/* the fork crosses the front tyre; redraw it on top so it never spins */}
      <Image className="fork" src="/hero-bike.png" alt="" aria-hidden width={PHOTO.w} height={PHOTO.h} sizes="(max-width: 900px) 90vw, 50vw" />
    </div>
  );
}
