"use client";

import { useState } from "react";
import InventoryEntry from "@/components/InventoryEntry";
import BarcodeAssigner from "@/components/BarcodeAssigner";
import type { Product, StockEntry } from "@/lib/database.types";

const TABS = [
  { value: "movimientos", label: "Entradas y salidas" },
  { value: "codigos", label: "Códigos de barras" },
] as const;

export default function InventoryView({
  products,
  recent,
}: {
  products: Product[];
  recent: StockEntry[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("movimientos");
  const missing = products.filter((p) => !p.barcode).length;

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
            {t.value === "codigos" && missing > 0 && (
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  tab === t.value
                    ? "bg-white/20"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {missing}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "movimientos" ? (
        <InventoryEntry products={products} recent={recent} />
      ) : (
        <BarcodeAssigner products={products} />
      )}
    </div>
  );
}
