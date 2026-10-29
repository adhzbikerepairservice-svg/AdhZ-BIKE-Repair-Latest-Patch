import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PayPanel from "@/components/PayPanel";
import PrintButton from "@/components/PrintButton";
import { payStatusOf, walletAccounts } from "@/lib/payment";
import { loadStore, store } from "@/lib/store";
import { ADDRESS } from "@/lib/maps";
import { dayLong, getMech, getService, hourLabel } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt | ADHZ Bike Repair & Service", robots: { index: false, follow: false } };

const peso = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadStore();
  const i = store.inquiries.find((x) => x.id === id);
  if (!i || !i.receipt) notFound();
  const r = i.receipt;
  const pay = r.payment === "ewallet" ? "E-wallet" + (r.payRef ? ` (ref ${r.payRef})` : "") : "Cash";
  const status = payStatusOf(r);
  const advance = r.advance ?? 0;
  const balance = Math.max(0, r.total - advance);
  const issued = new Date(r.doneAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  return (
    <section className="receiptwrap">
      <article className="receipt">
        <header className="rhead">
          <div className="rlogo">
            <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden>
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 3" />
              <path d="M16 16 L16 5 M16 16 L26 21 M16 16 L6 21" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div>
              <b>ADHZ</b>
              <small>Bike Repair &amp; Service</small>
            </div>
          </div>
          <div className="rtitle">
            <span>Receipt</span>
            <b>{r.no}</b>
          </div>
        </header>

        <div className="rmeta">
          <div>
            <small>Billed to</small>
            <b>{i.name}</b>
            <p>{i.email}</p>
            <p>{i.contact}</p>
          </div>
          <div>
            <small>From</small>
            <b>ADHZ Bike Repair &amp; Service</b>
            <p>{ADDRESS}</p>
            <p>0969 333 3473</p>
          </div>
          <div>
            <small>Issued</small>
            <b>{issued}</b>
            <small className="gap">Payment</small>
            <b>{pay}</b>
          </div>
        </div>

        <div className="rjob">
          <span><small>Service</small>{getService(i.service)?.name}</span>
          <span><small>Bike</small>{i.bike}{i.brand ? ` (${i.brand})` : ""}</span>
          <span><small>Visit</small>{dayLong(i.date)}, {hourLabel(i.hour)}</span>
          <span><small>Mechanic</small>{getMech(i.mech)?.name}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, k) => (
              <tr key={k}>
                <td>{l.label}</td>
                <td>{peso(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {advance > 0 && (
          <table className="advtable">
            <tbody>
              <tr><td>Total</td><td>{peso(r.total)}</td></tr>
              <tr><td>Less: deposit paid</td><td>-{peso(advance)}</td></tr>
              <tr><td><b>Balance</b></td><td><b>{peso(balance)}</b></td></tr>
            </tbody>
          </table>
        )}

        <div className="rtotal">
          <div className={`paidstamp ${status}`}>{status === "paid" ? "Paid" : status === "submitted" ? "Checking" : "Unpaid"}</div>
          <div className="rsum">
            <span>{status === "paid" ? "Total paid" : "Balance due"}</span>
            <b>{peso(status === "paid" ? r.total : balance)}</b>
          </div>
        </div>

        {r.payment === "ewallet" && status !== "paid" && (
          <PayPanel id={i.id} total={balance} status={status} wallets={await walletAccounts()} shopPhone="0969 333 3473" initialRef={r.payRef} />
        )}
        {r.note && <p className="rnote">{r.note}</p>}

        <footer className="rfoot">
          <p>Thank you for choosing ADHZ. Healing bikes, one ride at a time.</p>
          <small>Brgy. Camacho Cadre, Balanga City, Bataan · 0969 333 3473 · This receipt is valid without a signature.</small>
        </footer>
        <PrintButton id={i.id} no={r.no} />
      </article>
    </section>
  );
}
