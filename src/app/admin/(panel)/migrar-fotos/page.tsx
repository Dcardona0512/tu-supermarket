import { contarFotosPendientes } from "./actions";
import MigradorDeFotos from "./MigradorDeFotos";

/**
 * Pantalla de un solo uso para traer las fotos de La 53. Se borra al terminar.
 *
 * Cada lote son cinco descargas y cinco subidas, así que se le da margen a la
 * función para que no la corten a mitad.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async function MigrarFotosPage() {
  const pendientes = await contarFotosPendientes();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold">Traer las fotos de La 53</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Los productos se copiaron con sus fotos alojadas todavía en el Supabase
        antiguo. Esto se las trae a esta plataforma, para que sigan viéndose
        cuando aquel proyecto se apague.
      </p>

      <MigradorDeFotos pendientes={pendientes} />
    </div>
  );
}
