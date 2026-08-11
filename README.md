# TU SUPERMARKET

Plataforma de inventario y pedidos para tiendas tradicionales y supermercados.
Cada tienda tiene su propio catálogo en línea con su marca, y su panel para
gestionarlo. Los pedidos son con **pago contra entrega**, sin pasarela de pagos.

## Direcciones

| Ruta | Quién la usa |
| --- | --- |
| `/mi-tienda` | los clientes de esa tienda: catálogo, carrito y confirmación |
| `/admin` | el dueño de la tienda; se resuelve por su sesión, sin nombre en la URL |
| `/plataforma` | la administración de la plataforma: alta y suspensión de tiendas |
| `/registro` | alta de una tienda con código de invitación |

## Cambiar el dominio

Las tiendas cuelgan de una ruta (`/mi-tienda`), no de un subdominio, así que
mudarse de dominio **no toca código**:

1. Comprar el dominio.
2. En Vercel, *Project → Settings → Domains*, añadirlo al proyecto.
3. Apuntar el DNS donde indique Vercel. El certificado HTTPS lo emite Vercel solo.
4. Dejar el dominio viejo redirigiendo al nuevo, para no romper enlaces ya
   compartidos.

El panel no lleva el dominio escrito en ninguna parte: el enlace que se muestra
al tendero en *Personalizar tienda* y el de registro se arman con el dominio
desde el que se está navegando. En cuanto el dominio nuevo responda, el panel
mostrará el enlace correcto sin desplegar nada.

Para que el nombre de la tienda vaya **antes** del dominio
(`mi-tienda.ejemplo.co`) sí haría falta trabajo: un dominio comodín en Vercel y
un middleware que traduzca el subdominio a la ruta. Lo mismo para dominios
propios de cada tienda (`www.mitienda.com`), que además necesitan una columna
que relacione cada dominio con su tienda.

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

## Dar de alta una tienda

No hay registro abierto: nadie entra sin permiso.

1. En `/plataforma`, generar un código de invitación con el nombre de la tienda y
   su nombre corto, que es el que quedará en la URL y **no se puede cambiar
   después**. El formulario muestra el enlace resultante mientras se escribe.
2. Entregar el código al tendero, o el enlace `/registro?codigo=…`.
3. Él se registra con **su propio correo y la contraseña que elija**. La
   plataforma nunca conoce esa contraseña.

El código lo valida la base de datos al crear la cuenta: si no sirve, el alta se
aborta entera y no queda ningún usuario a medias. Cada código sirve una sola vez
y caduca a los 30 días.

Para dar de alta a un administrador de la plataforma hace falta una sentencia SQL
sobre `platform_admins` — deliberadamente, para que nadie pueda ascenderse desde
la aplicación.

## Catálogo de ejemplo

Cada tienda **nace con 6 categorías, 15 subcategorías y 24 productos de muestra**
con imágenes de `public/demo/`, para que el tendero vea cómo se verá su página y
cómo se organizan las categorías antes de cargar lo suyo. Lo hace la función
`seed_store_catalog(store_id)` desde el trigger del registro.

No se siembran pedidos: contarían como ventas suyas y le ensuciarían los informes
y el cierre de caja desde el primer día.

El tendero quita lo que no le sirva desde **Productos** y ajusta las categorías
con el botón **Categorías**.

`seed_store_catalog` solo inserta, nunca borra, y no hace nada si la tienda ya
tiene catálogo. **No existe ninguna función que borre datos en masa**: la que
había (`reset_demo`) se eliminó porque no filtraba por tienda y podía vaciar el
catálogo y el historial de ventas de todas.

## Modelo de datos (Supabase)

- `categories`, `products`, `orders`, `order_items`, `stock_entries` (todas con RLS).
- Los pedidos se crean con la función `create_order` (atómica: descuenta stock y evita sobreventa).
- Las ventas en tienda se registran con `create_pos_sale`; los informes con `sales_report` y `cash_closing`.
- La confirmación de pedido se lee vía `get_order_public` por UUID.

---

Hecho con [Claude Code](https://claude.com/claude-code).
