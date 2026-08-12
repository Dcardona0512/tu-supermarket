"use client";

import { useState } from "react";
import SalesReportView from "@/components/SalesReport";
import CashClosingView from "@/components/CashClosingView";
import type { CashClosing, SalesReport } from "@/lib/database.types";

const TABS = [
  { value: "ventas", label: "Informe de ventas" },
  { value: "caja", label: "Cierre de caja" },
] as const;

export default function ReportsView({
  report,
  closing,
  storeName,
}: {
  report: SalesReport;
  closing: CashClosing | null;
  /** Encabeza el comprobante impreso del cierre. */
  storeName: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("ventas");

  return (
    <div>
      <div className="mb-5 flex gap-1 rounded-lg bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t.value
                ? "bg-brand text-brand-text"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ventas" ? (
        <SalesReportView initialReport={report} />
      ) : (
        <CashClosingView initial={closing} storeName={storeName} />
      )}
    </div>
  );
}
