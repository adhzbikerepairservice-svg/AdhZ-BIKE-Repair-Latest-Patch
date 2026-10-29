import { Fragment, useEffect, useState } from "react";
import { cellState, CellState, dayLong, hourLabel, HOURS, isClosed, SHOP, Slot, ymd } from "@/lib/shop";

export interface Pick {
  date: string;
  mech: string;
  hour: number;
}

interface Props {
  dates: Date[];
  date: string;
  slots: Map<string, Slot>;
  sel: Pick | null;
  owner: boolean;
  onDate: (d: string) => void;
  onCell: (mech: string, hour: number) => void;
  /** Jump straight to a date + slot (used by "earliest available"). */
  onPick: (pick: Pick) => void;
}

const STATE_HINT: Record<CellState, string> = {
  open: "free",
  pending: "requested, waiting for the shop",
  booked: "booked",
  blocked: "not available",
  off: "not working",
  past: "already passed",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Schedule({ dates, date, slots, sel, owner, onDate, onCell, onPick }: Props) {
  const freeOn = (d: Date) =>
    isClosed(d)
      ? 0
      : SHOP.mechanics.reduce((n, m) => n + HOURS.filter((h) => cellState(slots, ymd(d), m, h) === "open").length, 0);

  const earliest = (() => {
    for (const d of dates) {
      if (isClosed(d)) continue;
      for (const h of HOURS) {
        for (const m of SHOP.mechanics) {
          if (cellState(slots, ymd(d), m, h) === "open") return { date: ymd(d), mech: m.id, hour: h, name: m.name };
        }
      }
    }
    return null;
  })();

  const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const months = Array.from(new Set(dates.map(monthKey)));
  const selDate = dates.find((d) => ymd(d) === date);
  const [month, setMonth] = useState(selDate ? monthKey(selDate) : months[0]);
  useEffect(() => {
    if (selDate) setMonth(monthKey(selDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  const shown = dates.filter((d) => monthKey(d) === month);
  const leading = shown.length ? (shown[0].getDay() + 6) % 7 : 0; // Monday-first calendar
  const monthName = (k: number) => new Date(Math.floor(k / 12), k % 12, 1);
  const idx = months.indexOf(month);
  const today = ymd(new Date());
  const day = dates.find((d) => ymd(d) === date);

  return (
    <div className="panel schedule">
      {!owner && earliest && (
        <button type="button" className="earliest" onClick={() => onPick(earliest)}>
          <span>
            <small>Earliest available</small>
            <b>
              {dayLong(earliest.date)} &middot; {hourLabel(earliest.hour)}
            </b>
            <em>with {earliest.name}</em>
          </span>
        </button>
      )}

      <div className="cal">
        <div className="monthbar" role="tablist" aria-label="Choose a month">
          {months.map((k) => {
            const m = monthName(k);
            return (
              <button key={k} type="button" role="tab" aria-selected={k === month} onClick={() => setMonth(k)}>
                <b>{m.toLocaleDateString(undefined, { month: "short" })}</b>
                <small>{m.getFullYear()}</small>
              </button>
            );
          })}
        </div>
        <div className="cal-title">
          <b>{monthName(month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b>
          <span className="monthnav">
            <button type="button" className="linkbtn" disabled={idx <= 0} onClick={() => setMonth(months[idx - 1])}>Previous month</button>
            <button type="button" className="linkbtn" disabled={idx >= months.length - 1} onClick={() => setMonth(months[idx + 1])}>Next month</button>
          </span>
        </div>
        <div className="cal-grid" role="group" aria-label="Choose a date">
          {WEEKDAYS.map((w) => (
            <span key={w} className="cal-wd" aria-hidden>
              {w}
            </span>
          ))}
          {Array.from({ length: leading }, (_, i) => (
            <span key={`b${i}`} aria-hidden />
          ))}
          {shown.map((d) => {
            const s = ymd(d);
            const closed = isClosed(d);
            const free = freeOn(d);
            return (
              <button
                key={s}
                type="button"
                className={`cal-day${s === today ? " today" : ""}${!closed && !free ? " full" : ""}`}
                aria-pressed={s === date}
                aria-label={`${dayLong(s)}, ${closed ? "closed" : free ? `${free} slots free` : "fully booked"}`}
                disabled={closed}
                onClick={() => onDate(s)}
              >
                <b>{d.getDate()}</b>
                <small>{closed ? "Closed" : free ? `${free} free` : "Full"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="times" key={date}>
        <div className="cal-title">
          <b>{day ? dayLong(ymd(day)) : ""}</b>
          <span className="note">Lunch break 12:00 to 1:00 PM</span>
        </div>
        {SHOP.mechanics.map((m) => {
          const states = HOURS.map((h) => cellState(slots, date, m, h));
          const working = states.some((st) => st !== "off");
          const open = states.filter((st) => st === "open").length;
          return (
            <div key={m.id} className="mech">
              <div className="mech-head">
                <span>
                  <b>{m.name}</b>
                  <small>{m.role}</small>
                </span>
                {working && <span className={`mech-count${open ? "" : " none"}`}>{open ? `${open} free` : "No free slots"}</span>}
              </div>
              {working ? (
                <div className="slots">
                  {HOURS.map((h, i) => {
                    const st = states[i];
                    if (st === "past") return null; // times that already passed are hidden, not struck through
                    const picked = sel?.mech === m.id && sel.hour === h && sel.date === date;
                    const own = owner && (st === "open" || st === "blocked");
                    const firstOfPart = HOURS.findIndex((x, k) => states[k] !== "past" && (h < 12 ? x < 12 : x >= 12)) === i;
                    return (
                      <Fragment key={h}>
                        {firstOfPart && <span className="daypart">{h < 12 ? "Morning" : "Afternoon"}</span>}
                      <button
                        key={h}
                        type="button"
                        className={`slot ${picked ? "sel" : st}${own ? " owner" : ""}`}
                        disabled={!(st === "open" || own)}
                        aria-pressed={picked}
                        aria-label={`${m.name}, ${hourLabel(h)}, ${STATE_HINT[st]}`}
                        onClick={() => onCell(m.id, h)}
                      >
                        {hourLabel(h)}
                      </button>
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                <p className="note">Not working on this day.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="legend">
        <span><i className="l-open" />Free</span>
        <span><i className="l-pending" />Requested</span>
        <span><i className="l-booked" />Booked / blocked</span>
      </div>
      {owner && <p className="note">Shop view: click a free slot to block it, click a blocked slot to release it.</p>}
    </div>
  );
}
