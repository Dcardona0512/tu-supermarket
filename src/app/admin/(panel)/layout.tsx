import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import NewOrderAlert from "@/components/NewOrderAlert";
import { createClient } from "@/lib/supabase/server";
import { toDisplayUser } from "@/lib/admin-user";
import { darken, readableText, inkOnWhite } from "@/lib/brand";

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

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, logo_url, brand_color")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Sin tienda no hay panel, pero sí hay salida: pasa cuando entra con Google,
  // Facebook o Apple y su correo no estaba reservado en la invitación, así que
  // lo que le falta es canjear su código.
  if (!store) redirect("/registro");

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
    // El panel toma el color de la tienda, igual que su escaparate: el tendero
    // lo elige una vez y lo ve en los dos sitios. La marca de la plataforma
    // sigue en el texto del menú, no en el color.
    <div
      className="min-h-screen bg-neutral-100"
      style={
        {
          "--brand": store.brand_color,
          "--brand-dark": darken(store.brand_color),
          "--brand-text": readableText(store.brand_color),
          "--brand-ink": inkOnWhite(store.brand_color),
        } as React.CSSProperties
      }
    >
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
