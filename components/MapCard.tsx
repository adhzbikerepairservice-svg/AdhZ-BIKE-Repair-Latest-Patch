"use client";

import { useEffect, useRef, useState } from "react";
import { ADDRESS, distanceKm, mapLinks, SHOP_POINT } from "@/lib/maps";

const FAR_KM = 10; // at or beyond this distance the "You" dot sits at the start of the route

/** Stylised neighbourhood map: always renders instantly, animates a route to the shop. */
function MapArt({ progress }: { progress: number | null }) {
  const route = useRef<SVGPathElement>(null);
  const [you, setYou] = useState({ x: 40, y: 150 });
  useEffect(() => {
    const path = route.current;
    if (!path || progress === null) return setYou({ x: 40, y: 150 });
    const pt = path.getPointAtLength(path.getTotalLength() * progress);
    setYou({ x: pt.x, y: pt.y });
  }, [progress]);
  return (
    <svg className="mapart" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrated map showing the route to ADHZ Bike Repair & Service">
      <rect width="1200" height="500" fill="#e4f0fa" />
      <g transform="translate(10 0)">
      {/* parks + water */}
      <path d="M-20 360 Q120 330 220 400 T420 520 L-20 520Z" fill="#cfe9d6" />
      <path d="M900 -20 Q1000 90 1220 60 L1220 -20Z" fill="#bfe0f5" />
      {/* city blocks */}
      <g fill="#f7fafd" stroke="#d3e2ef" strokeWidth="2">
        <rect x="40" y="40" width="150" height="90" rx="10" />
        <rect x="230" y="40" width="130" height="90" rx="10" />
        <rect x="40" y="170" width="150" height="110" rx="10" />
        <rect x="430" y="40" width="100" height="90" rx="10" />
        <rect x="430" y="170" width="140" height="110" rx="10" />
        <rect x="620" y="170" width="140" height="110" rx="10" />
        <rect x="620" y="320" width="140" height="130" rx="10" />
        <rect x="800" y="40" width="150" height="90" rx="10" />
        <rect x="800" y="170" width="150" height="110" rx="10" />
        <rect x="800" y="330" width="150" height="120" rx="10" />
        <rect x="990" y="170" width="170" height="110" rx="10" />
        <rect x="990" y="330" width="170" height="120" rx="10" />
        <rect x="-230" y="40" width="150" height="90" rx="10" />
        <rect x="-230" y="170" width="150" height="110" rx="10" />
        <rect x="-230" y="330" width="150" height="120" rx="10" />
        <rect x="430" y="330" width="140" height="120" rx="10" />
      </g>
      {/* roads */}
      <g fill="none" strokeLinecap="round">
        <g stroke="#fff" strokeWidth="26">
          <path d="M-400 150 L1600 150" />
          <path d="M210 -20 L210 520" />
          <path d="M590 -20 L590 520" />
          <path d="M-400 300 L1600 300" />
        </g>
        <g stroke="#c9d9e8" strokeWidth="2" strokeDasharray="10 12">
          <path d="M-400 150 L1600 150" />
          <path d="M210 -20 L210 520" />
          <path d="M590 -20 L590 520" />
          <path d="M-400 300 L1600 300" />
        </g>
      </g>
      {/* street labels */}
      <g fill="#7b8fa8" fontSize="14" fontWeight="600" fontFamily="sans-serif">
        <text x="60" y="145">Valencia St</text>
        <text x="62" y="295">Talastas St</text>
        <text x="604" y="400" transform="rotate(90 604 400)">Camacho Rd</text>
      </g>
      {/* route from "you" to the shop */}
      <path ref={route} className="route" d="M40 150 L590 150 L590 300 L700 300" fill="none" stroke="#1f52c4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="youdot" cx={you.x} cy={you.y} r="11" fill="#fff" stroke="#1f52c4" strokeWidth="5" />
      <g transform={`translate(${you.x + 20} ${you.y - 50})`}>
        <rect width="64" height="26" rx="13" fill="#1f52c4" />
        <text x="32" y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="sans-serif">You</text>
      </g>
      {/* shop marker: a bike in a badge */}
      <g transform="translate(700 300)">
        <circle className="pinpulse" r="14" fill="#f2b922" />
        <path d="M-12 -52 L12 -52 L0 -8Z" fill="#1f52c4" />
        <g transform="translate(52 -92)">
          <rect width="150" height="30" rx="15" fill="#fff" stroke="#d3e2ef" strokeWidth="2" />
          <text x="75" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e2b52" fontFamily="sans-serif">ADHZ Bike Repair</text>
        </g>
        <circle cy="-66" r="38" fill="#1f52c4" stroke="#fff" strokeWidth="5" />
        <g transform="translate(0 -66)" fill="none" stroke="#fff" strokeWidth="3.500" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="-15" cy="8" r="9" />
          <circle cx="15" cy="8" r="9" />
          <path d="M-15 8 L-4 -8 L9 -8 L15 8 M-4 -8 L2 8 L-15 8 M9 -8 L6 -14 L11 -14 M-6 -13 L-1 -13" stroke="#f2b922" />
        </g>
      </g>
      </g>
    </svg>
  );
}

/** Map of the shop with a compact directions card; opens Waze, Google Maps or Apple Maps. */
export default function MapCard() {
  const [live, setLive] = useState(false);
  const [track, setTrack] = useState<"off" | "asking" | "on" | "denied">("off");
  const [km, setKm] = useState<number | null>(null);
  const watch = useRef<number | null>(null);

  const start = () => {
    if (!navigator.geolocation) return setTrack("denied");
    setTrack("asking");
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        setTrack("on");
        setKm(distanceKm({ lat: pos.coords.latitude, lng: pos.coords.longitude }, SHOP_POINT));
      },
      () => setTrack("denied"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  };
  const stop = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setTrack("off");
    setKm(null);
  };
  useEffect(() => () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); }, []);

  const progress = km === null ? null : Math.min(0.96, Math.max(0.04, 1 - km / FAR_KM));
  const eta = km === null ? 0 : Math.max(1, Math.round((km / 25) * 60));
  return (
    <div className="mapcard" id="map">
      {live ? (
        <iframe className="mapframe" title="Live map of ADHZ Bike Repair & Service" src={mapLinks.embed} referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <MapArt progress={progress} />
      )}
      <div className="mapinfo">
        <div>
          <span className="eyebrow">Find us</span>
          <p className="big">{ADDRESS}</p>
        </div>
        <div className="locate">
          {track === "on" && km !== null ? (
            <div className="locstat" role="status">
              <b>{km < 0.1 ? "You're here" : km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`}</b>
              <span>{km < 0.1 ? "Come on in!" : `about ${eta} min by bike or car`}</span>
              <button type="button" className="linkbtn" onClick={stop}>Stop tracking</button>
            </div>
          ) : (
            <button type="button" className="btn ghost locbtn" onClick={start} disabled={track === "asking"}>
              {track === "asking" ? "Finding you..." : "Show my location"}
            </button>
          )}
          {track === "denied" && <p className="note">We couldn't get your location. Allow location access in your browser and try again.</p>}
        </div>
        <div className="navbtns">
          <a className="btn" href={mapLinks.waze} target="_blank" rel="noreferrer">
            Waze
          </a>
          <a className="btn outline" href={mapLinks.google} target="_blank" rel="noreferrer">
            Google Maps
          </a>
        </div>
        <div className="mapsub">
          <button type="button" className="linkbtn" onClick={() => setLive((v) => !v)}>
            {live ? "Show simple map" : "Show live map"}
          </button>
          <a className="note" href={mapLinks.apple} target="_blank" rel="noreferrer">
            Apple Maps
          </a>
        </div>
      </div>
    </div>
  );
}
