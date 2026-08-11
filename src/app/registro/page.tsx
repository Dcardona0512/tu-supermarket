import { Suspense } from "react";
import type { Metadata } from "next";
import RegistroForm from "@/components/RegistroForm";

export const metadata: Metadata = {
  title: "Abrir tu tienda · TU SUPERMARKET",
  description:
    "Crea la cuenta de tu tienda con el código de invitación que recibiste.",
};

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
