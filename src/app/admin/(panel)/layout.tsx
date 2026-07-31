import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import NewOrderAlert from "@/components/NewOrderAlert";
import { createClient } from "@/lib/supabase/server";
import { toDisplayUser } from "@/lib/admin-user";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Pedidos web sin atender: se muestran como aviso en el menú
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("channel", "linea")
    .eq("status", "pendiente");

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminSidebar
        user={toDisplayUser(user.email)}
        pendingOrders={pendingOrders ?? 0}
      />
      {/* Espacio para la franja lateral de iconos */}
      <div className="pl-20">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>

      <NewOrderAlert />
    </div>
  );
}
