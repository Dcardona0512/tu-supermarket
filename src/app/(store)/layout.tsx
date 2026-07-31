import { CartProvider } from "@/lib/cart";
import StoreShell from "@/components/StoreShell";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreShell>{children}</StoreShell>
    </CartProvider>
  );
}
