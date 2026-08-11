import StoreSettings from "@/components/StoreSettings";
import { requireStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const { store } = await requireStore();

  return <StoreSettings store={store} />;
}
