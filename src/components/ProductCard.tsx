"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import ProductImageViewer from "@/components/ProductImageViewer";
import type { Product } from "@/lib/database.types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const hasDiscount =
    product.discount_price != null && product.discount_price < product.price;
  const effectivePrice = hasDiscount
    ? (product.discount_price as number)
    : product.price;
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image_url: product.image_url,
      unit: product.unit,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square w-full bg-white">
        {product.image_url ? (
          // La foto completa, sin recortar, y ampliable al tocarla
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={`Ver ${product.name} en grande`}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-contain p-2"
            />
            <span className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIcon />
            </span>
          </button>
        ) : (
          <div className="grid h-full w-full place-items-center text-neutral-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            Oferta
          </span>
        )}
        {outOfStock && (
          // No bloquea el clic: aunque esté agotado se puede ver la foto
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-white/70 text-sm font-semibold text-neutral-600">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            {product.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <span className="mt-0.5 text-xs text-neutral-500">
          Por {product.unit}
        </span>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatCOP(effectivePrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              {formatCOP(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {outOfStock ? "Sin stock" : added ? "¡Agregado!" : "Agregar"}
        </button>
      </div>

      {zoomed && product.image_url && (
        <ProductImageViewer
          src={product.image_url}
          alt={product.name}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
    </svg>
  );
}
