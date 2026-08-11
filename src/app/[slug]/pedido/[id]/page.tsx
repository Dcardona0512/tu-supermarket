import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type OrderItem = {
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type OrderPublic = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string | null;
  total: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_order_public", { p_order_id: id });
  const order = data as OrderPublic | null;

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-3 text-xl font-bold">¡Pedido confirmado!</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tu número de pedido es{" "}
          <span className="font-bold text-foreground">
            #{order.order_number}
          </span>
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Nos pondremos en contacto para coordinar la entrega. Pagarás al
          recibir, <strong>en efectivo o por transferencia</strong>.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
          Resumen
        </h2>
        <ul className="divide-y divide-black/5">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex justify-between py-2 text-sm">
              <span>
                {it.quantity} × {it.product_name}
              </span>
              <span className="font-medium">{formatCOP(it.subtotal)}</span>
            </li>
          ))}
        </ul>
        {Number(order.delivery_fee) > 0 && (
          <div className="mt-2 flex justify-between border-t border-black/5 pt-2 text-sm text-neutral-500">
            <span>Domicilio</span>
            <span>{formatCOP(Number(order.delivery_fee))}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-black/5 pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatCOP(order.total)}</span>
        </div>

        <dl className="mt-4 space-y-1 text-sm text-neutral-600">
          <Row label="Cliente" value={order.customer_name} />
          <Row label="Celular" value={order.customer_phone} />
          <Row label="Dirección" value={order.customer_address} />
          <Row label="Pago" value="Al recibir el pedido" />
          {order.notes && <Row label="Notas" value={order.notes} />}
          <Row label="Fecha" value={formatDate(order.created_at)} />
        </dl>
      </div>

      <div className="mt-5 text-center">
        <Link
          href={`/${slug}`}
          className="inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-dark"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
