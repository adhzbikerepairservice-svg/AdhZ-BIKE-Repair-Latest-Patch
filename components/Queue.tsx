import { dayLong, getMech, getService, hourLabel, Inquiry } from "@/lib/shop";

interface Props {
  inquiries: Inquiry[];
  onAct: (id: string, action: "confirm" | "decline") => void;
}

export default function Queue({ inquiries, onAct }: Props) {
  return (
    <section>
      <div className="sec-head">
        <h2>Inquiry queue</h2>
        <p>Visible to shop editors only. Confirming keeps the slot reserved; declining frees it.</p>
      </div>
      <div className="queue">
        {inquiries.length === 0 && (
          <div className="empty">No inquiries yet. New requests from customers will appear here.</div>
        )}
        {inquiries.map((i) => (
          <article key={i.id} className="inq">
            <div>
              <h3>
                {i.name}
                <span className={`badge ${i.status}`}>{i.status}</span>
              </h3>
              <p>
                <b>{getService(i.service)?.name ?? i.service}</b> &middot; {i.bike}
                {i.brand ? ` (${i.brand})` : ""} &middot; {i.contact}
              </p>
              <p>
                {getMech(i.mech)?.name ?? i.mech} &middot; {dayLong(i.date)} at {hourLabel(i.hour)}
              </p>
              <p>
                {i.handover === "collect" ? `Home pick-up and delivery (extra fee) · ${i.address || "no address"}` : "Customer brings it in and picks it up"}
                {i.pickup ? ` · Pick-up wanted ${dayLong(i.pickup)}` : " · Pick-up day: call when ready"}
              </p>
              {i.notes && <p>&ldquo;{i.notes}&rdquo;</p>}
            </div>
            <div className="acts">
              {i.status === "pending" && (
                <button className="btn sm" onClick={() => onAct(i.id, "confirm")}>
                  Confirm
                </button>
              )}
              {i.status !== "declined" && (
                <button className="btn ghost" onClick={() => onAct(i.id, "decline")}>
                  Decline
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
