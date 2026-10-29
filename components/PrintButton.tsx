"use client";

/** Two separate actions: print on paper, or download the receipt as a real PDF file. */
export default function PrintButton({ id, no }: { id: string; no: string }) {
  return (
    <div className="rbtns noprint">
      <button type="button" className="btn outline" onClick={() => window.print()}>
        Print
      </button>
      <a className="btn" href={`/receipt/${id}/pdf`} download={`${no}.pdf`}>
        Save as PDF
      </a>
    </div>
  );
}
