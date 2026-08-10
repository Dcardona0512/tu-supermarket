# TU SUPERMARKET

Aplicación web de inventario y pedidos para tiendas tradicionales y supermercados.
Los clientes navegan el catálogo y hacen pedidos con **pago contra entrega** (sin pasarela de pagos), y el administrador gestiona todo desde un dashboard.

## Funcionalidades

### Tienda (clientes, sin registro)
- Catálogo con imágenes, precios (COP), ofertas y estado de stock.
- Búsqueda y filtro por categoría y subcategoría.
- Carrito persistente (localStorage).
- Checkout contra entrega con formulario (nombre, celular, dirección) y confirmación con número de pedido.

### Dashboard (administrador)
- Acceso con usuario y contraseña.
- Resumen: productos, pedidos pendientes, ventas y alertas de stock bajo y de productos por vencer.
- Gestión de productos: crear/editar/eliminar, subida de imágenes, categorías y subcategorías, marca, código de barras, unidad, oferta/descuento, stock, vencimiento y visibilidad.
- Punto de venta (POS) con lector de código de barras.
- Entradas de inventario, informes de ventas y cierre de caja.
- Gestión de pedidos: detalle del cliente y cambio de estado (pendiente → entregado / cancelado).

## Tecnologías

- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase**: Postgres (con RLS), Auth (email/contraseña) y Storage (imágenes)
- Despliegue en **Vercel**

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # completa las variables de Supabase
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave publishable (segura para el navegador) |

## Usuario del panel

El login usa un nombre de usuario, no un correo: internamente se convierte a
`<usuario>@tusupermarket.com` (ver `src/lib/admin-user.ts`). El usuario se crea desde
el panel de Supabase, en **Authentication → Add user**, con ese formato de correo.

## Datos de ejemplo

`supabase/seed-demo.sql` deja una tienda con 6 categorías, 15 subcategorías, 24
productos con precios en COP e imágenes de `public/demo/`, y tres pedidos, uno en
cada estado. Sirve para enseñar el sistema antes de que una tienda cargue su
inventario real.

Se ejecuta **desde el editor SQL de Supabase**: la función que hace el trabajo
borra productos, categorías, pedidos e inventario sin filtro, así que no está
concedida a los usuarios de la aplicación y no se puede invocar desde la web.

Para dejar el catálogo en blanco: `delete from products; delete from categories;`.

## Modelo de datos (Supabase)

- `categories`, `products`, `orders`, `order_items`, `stock_entries` (todas con RLS).
- Los pedidos se crean con la función `create_order` (atómica: descuenta stock y evita sobreventa).
- Las ventas en tienda se registran con `create_pos_sale`; los informes con `sales_report` y `cash_closing`.
- La confirmación de pedido se lee vía `get_order_public` por UUID.

---

Hecho con [Claude Code](https://claude.com/claude-code).
