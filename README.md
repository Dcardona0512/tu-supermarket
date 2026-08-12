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
- **Personalizar tienda**: nombre, frase, logo, color, teléfono, dirección y valor del domicilio, con vista previa en vivo.

## La marca de cada tienda

El tendero elige **un** color y con eso se pinta todo: su catálogo, su panel y el
icono de la pestaña. La marca de la plataforma (TU SUPERMARKET) sigue en el texto
del menú, no en el color.

Como el color es libre —hay una paleta sugerida y también un pincel—, no se puede
dar por hecho que encima va texto blanco. De un solo color se derivan cuatro, en
[`src/lib/brand.ts`](src/lib/brand.ts), y entran como variables CSS:

| Variable | Para qué | Cómo sale |
| --- | --- | --- |
| `--brand` | fondos de botón, cabecera, chips activos | tal cual lo eligió |
| `--brand-dark` | el `hover` de esos botones | 22% más oscuro |
| `--brand-text` | el texto **encima** del color | blanco o casi negro, por luminancia |
| `--brand-ink` | el texto **del** color sobre fondo claro | se oscurece hasta llegar a 4.5:1 sobre blanco |

Los dos últimos son los que permiten dejar elegir un amarillo sin que queden
botones ni precios ilegibles. Se inyectan en dos sitios —el escaparate y el
panel—, así que ningún componente necesita saber de qué tienda es.

El **icono de la pestaña** lo genera `/[slug]/icono`: si la tienda subió logo, se
usa el logo; si no, sus iniciales sobre su color. La dirección lleva `?v=` con la
fecha de la última modificación de la tienda, porque el icono se sirve con caché
de un año: sin ese número, cambiar el color no cambiaría nada en el navegador del
cliente.

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

## Correo de confirmación

Al registrarse, el tendero recibe un correo y su enlace lo tiene que dejar
**dentro de su panel**, no en una página en blanco. Eso lo resuelve
`/auth/confirmar`, que canjea el enlace, abre la sesión y lo manda a `/admin`. Si
el enlace venció o ya se usó, cae en el acceso con el motivo en español.

Hay que dejar tres cosas puestas en el panel de Supabase (*Authentication*), una
sola vez por proyecto:

1. **URL Configuration → Site URL:** el dominio de producción.
2. **URL Configuration → Redirect URLs:** añadir `https://EL-DOMINIO/auth/confirmar`
   y, para poder probar en local, `http://localhost:3000/auth/confirmar`. Sin
   esto Supabase ignora el destino y devuelve al Site URL.
3. **Email Templates → Confirm signup:** cambiar el cuerpo por un enlace con
   `TokenHash`:

   ```html
   <a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email">
     Confirmar mi cuenta
   </a>
   ```

El paso 3 importa más de lo que parece. La plantilla de fábrica manda un enlace
del flujo PKCE, cuyo verificador vive en las cookies del navegador donde se hizo
el registro: si el tendero se registra en el computador de la tienda y abre el
correo en el celular, el enlace falla. Con `TokenHash` la validación es entera
del servidor y funciona desde cualquier equipo. La ruta acepta las dos formas, así
que nada se rompe mientras la plantilla siga sin cambiar.

Queda pendiente un **SMTP propio**: el de pruebas de Supabase manda unos pocos
correos por hora y suele caer en no deseado.

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
