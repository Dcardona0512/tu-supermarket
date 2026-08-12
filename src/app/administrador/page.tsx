import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdministradorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: esAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Una tienda cualquiera que teclee /administrador va a su propio panel: no
  // tiene por qué saber que esta pantalla existe.
  if (!esAdmin) redirect("/admin");

  const [{ data: stores }, { data: invites }] = await Promise.all([
    supabase
      .from("stores")
      .select("id, slug, name, is_published, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("store_invites")
      .select("id, code, store_name, slug, email, expires_at, used_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminPanel
      stores={(stores ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        isPublished: s.is_published,
        createdAt: formatDate(s.created_at),
      }))}
      invites={(invites ?? []).map((i) => ({
        id: i.id,
        code: i.code,
        storeName: i.store_name,
        slug: i.slug,
        correo: i.email,
        usada: i.used_at != null,
        vencida: new Date(i.expires_at) < new Date(),
        expira: formatDate(i.expires_at),
      }))}
    />
  );
}
