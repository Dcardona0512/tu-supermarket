import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import RegistroForm from "@/components/RegistroForm";
import CanjearCodigo from "@/components/CanjearCodigo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Abrir tu tienda · TU SUPERMARKET",
  description:
    "Crea la cuenta de tu tienda con el código de invitación que recibiste.",
};

export const dynamic = "force-dynamic";

/**
 * Alta de una tienda. Tiene tres caras según con qué llega el visitante:
 *
 *   - sin cuenta: el formulario completo, con los botones de Google, Facebook
 *     y Apple;
 *   - con cuenta pero sin tienda: solo el código. Es lo que pasa cuando entró
 *     con un proveedor y su correo no estaba reservado en la invitación;
 *   - con cuenta y con tienda: no tiene nada que hacer aquí, va a su panel.
 */
export default async function RegistroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (store) redirect("/admin");

    return <CanjearCodigo correo={user.email ?? ""} />;
  }

  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
