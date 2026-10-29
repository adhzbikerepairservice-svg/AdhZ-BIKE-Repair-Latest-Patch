"use client";

import { useCallback, useEffect, useState } from "react";
import { buildDates, isClosed, SHOP, Slot, ymd } from "@/lib/shop";
import Schedule, { Pick } from "./Schedule";
import InquiryForm from "./InquiryForm";
import { ICONS } from "./Services";

const POLL_MS = 5000;

export default function BikeShop({ initialService = "" }: { initialService?: string }) {
  // Dates depend on the current time, so they are computed after mount to avoid hydration mismatch.
  const [dates, setDates] = useState<Date[]>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Map<string, Slot>>(new Map());
  const [sel, setSel] = useState<Pick | null>(null);
  const [service, setService] = useState(initialService);
  useEffect(() => {
    const ds = buildDates();
    setDates(ds);
    setDate(ymd(ds.find((d) => !isClosed(d)) ?? ds[0]));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (res.ok) {
        const data: { slots: [string, Slot][] } = await res.json();
        setSlots(new Map(data.slots));
      }
    } catch {
      /* keep last known state */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <>
      <section id="book">
        <div className="sec-head">
          <h1 className="pagetitle">Book a visit</h1>
        </div>
        <ol className="rail" aria-label="Booking steps">
          {(
            [
              ["Service", "fService", !!service],
              ["Time", "fTime", !!sel],
              ["Details", "fDetails", false],
              ["Payment", "fPay", false],
            ] as [string, string, boolean][]
          ).map(([label, target, done], i, all) => {
            const earlierDone = all.slice(0, Math.min(i, 2)).every((x) => x[2]);
            const now = !done && earlierDone && (i < 2 || (!!service && !!sel && i === 2));
            return (
              <li key={label} className={done ? "is-done" : now ? "now" : ""}>
                <a
                  href={"#" + target}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <span className="rn">{done ? "\u2713" : i + 1}</span>
                  {label}
                </a>
              </li>
            );
          })}
        </ol>
        <div className="book">
          <div className="leftcol">
            <div className="panel">
              <h3 className="steph">
                <span className="step">1</span>Choose a service
              </h3>
              <div id="fService" tabIndex={-1} className="svcpicks" role="radiogroup" aria-label="Service">
                {SHOP.services.map((sv) => (
                  <button key={sv.id} type="button" role="radio" aria-checked={service === sv.id} className="svcpick" onClick={() => setService(sv.id)}>
                    <span className="tile-icon" aria-hidden>
                      {ICONS[sv.id]}
                    </span>
                    <b>{sv.name}</b>
                    <small>{sv.items.slice(0, 2).join(" · ")}</small>
                    <i className="tick" aria-hidden>&#10003;</i>
                  </button>
                ))}
              </div>
            </div>
            <div id="fTime">
              <h3 className="steph">
                <span className="step">2</span>Pick a time
              </h3>
              {date ? (
                <Schedule
                  dates={dates}
                  date={date}
                  slots={slots}
                  sel={sel}
                  owner={false}
                  onDate={setDate}
                  onCell={(mech, hour) => setSel({ date, mech, hour })}
                  onPick={(pick) => {
                    setDate(pick.date);
                    setSel(pick);
                  }}
                />
              ) : (
                <div className="panel skeleton" aria-busy="true" aria-label="Loading schedule" />
              )}
            </div>
          </div>
          <InquiryForm
            sel={sel}
            service={service}
            onAnother={() => setService("")}
            onSent={() => {
              setSel(null);
              refresh();
            }}
            onTaken={() => {
              setSel(null);
              refresh();
            }}
          />
        </div>
      </section>

    </>
  );
}
