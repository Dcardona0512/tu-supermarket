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

  // Sin tienda no hay panel que mostrar: pasa si la cuenta se creó a mano en
  // Supabase sin darla de alta como tienda.
  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, logo_url, brand_color")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!store) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold">Esta cuenta no tiene tienda</h1>
          <p className="mt-2 text-sm text-neutral-600">
            No hay ninguna tienda asociada a {toDisplayUser(user.email)}, así que
            no hay nada que administrar.
          </p>
        </div>
      </div>
    );
  }

  // Pedidos web sin atender: se muestran como aviso en el menú. Las políticas
  // ya lo limitan a esta tienda.
  const [{ count: pendingOrders }, { data: esAdminPlataforma }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("channel", "linea")
        .eq("status", "pendiente"),
      supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminSidebar
        user={toDisplayUser(user.email)}
        pendingOrders={pendingOrders ?? 0}
        storeName={store.name}
        storeSlug={store.slug}
        storeLogoUrl={store.logo_url}
        storeBrandColor={store.brand_color}
        isPlatformAdmin={Boolean(esAdminPlataforma)}
      />
      {/* Espacio para la franja lateral de iconos */}
      <div className="pl-20">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>

      <NewOrderAlert storeId={store.id} />
    </div>
  );
}
