import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminSidebar from "@/components/AdminSidebar";
import NewOrderAlert from "@/components/NewOrderAlert";
import { getSessionStore } from "@/lib/store";
import { toDisplayUser } from "@/lib/admin-user";
import { darken, readableText, inkOnWhite } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * La pestaña del panel dice «Panel», y lleva el icono de la tienda.
 *
 * Lo primero es para distinguirla de un tirón cuando el tendero tiene abiertas
 * las dos: su escaparate lleva el nombre del negocio y esta lleva «Panel».
 *
 * Y el icono es el mismo que genera su tienda, con la misma versión en la URL, de
 * modo que si cambia su color el favicon del panel cambia con él. Antes esta
 * pestaña mostraba el icono de la plataforma, así que personalizar cambiaba el de
 * la tienda pero no el del panel.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getSessionStore();
  if (!store) return { title: "Panel" };

  const icono = `/${store.slug}/icono?v=${store.version}`;

  return {
    title: "Panel",
    icons: {
      icon: [{ url: icono, type: "image/png", sizes: "64x64" }],
      apple: [
        { url: `${icono}&size=180`, type: "image/png", sizes: "180x180" },
      ],
    },
  };
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, store } = await getSessionStore();

  if (!user) redirect("/login");

  // Quien administra la plataforma entra a este panel como cualquier tendero, y
  // desde el menú tiene el atajo a su administración. Hubo un rato en que se le
  // desviaba a `/administrador`, y el resultado fue que la misma cuenta que es
  // dueña de una tienda no podía llegar nunca a su panel.
  const { data: esAdminPlataforma } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Sin tienda no hay panel, pero sí hay salida: pasa cuando entra con Google,
  // Facebook o Apple y su correo no estaba reservado en la invitación, así que
  // lo que le falta es canjear su código.
  if (!store) redirect("/registro");

  // Pedidos web sin atender: se muestran como aviso en el menú. Las políticas
  // ya lo limitan a esta tienda.
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("channel", "linea")
    .eq("status", "pendiente");

  return (
    // El panel toma el color de la tienda, igual que su escaparate: el tendero
    // lo elige una vez y lo ve en los dos sitios. La marca de la plataforma
    // sigue en el texto del menú, no en el color.
    <div
      className="min-h-screen bg-neutral-100"
      style={
        {
          "--brand": store.brandColor,
          "--brand-dark": darken(store.brandColor),
          "--brand-text": readableText(store.brandColor),
          "--brand-ink": inkOnWhite(store.brandColor),
        } as React.CSSProperties
      }
    >
      <AdminSidebar
        user={toDisplayUser(user.email)}
        pendingOrders={pendingOrders ?? 0}
        storeName={store.name}
        storeSlug={store.slug}
        storeLogoUrl={store.logoUrl}
        storeBrandColor={store.brandColor}
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
