import Configuracion from "@/components/Configuracion";
import { requireStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const { store, user } = await requireStore();

  return <Configuracion store={store} correo={user.email ?? ""} />;
}
