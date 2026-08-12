# TU SUPERMARKET

Plataforma de inventario y pedidos para tiendas tradicionales y supermercados.
Cada tienda tiene su propio catálogo en línea con su marca, y su panel para
gestionarlo. Los pedidos son con **pago contra entrega**, sin pasarela de pagos.

## Direcciones

| Ruta | Quién la usa |
| --- | --- |
| `/` | nadie en particular: redirige al acceso. Es también donde cae Supabase cuando no puede usar el destino que pide la aplicación |
| `/login` | la entrada al panel. Cuelga de la raíz, no de `/admin`, porque es el enlace que se le pasa al tendero |
| `/mi-tienda` | los clientes de esa tienda: catálogo, carrito y confirmación |
| `/admin` | el dueño de la tienda; se resuelve por su sesión, sin nombre en la URL |
| `/plataforma` | la administración de la plataforma: alta y suspensión de tiendas |
| `/registro` | alta de una tienda con código de invitación, o canje del código si entró con un proveedor |
| `/recuperar` | pedir el enlace para poner otra contraseña |
| `/clave` | escribir la contraseña nueva |
| `/auth/confirmar` | aterrizaje de los correos y de Google, Facebook y Apple |

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
- Enlace al panel en el pie de página, para que el tendero entre desde su propia tienda.

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
2. Si sabes su correo, escribirlo ahí también. No es obligatorio, pero es lo que
   le permite entrar con Google, Facebook o Apple sin escribir el código.
3. Entregar el código al tendero, o el enlace `/registro?codigo=…`.
4. Él entra con **su propio correo y la contraseña que elija**, o con el
   proveedor que prefiera. La plataforma nunca conoce esa contraseña.

El código lo valida la base de datos al crear la cuenta: si no sirve, el alta se
aborta entera y no queda ningún usuario a medias. Cada código sirve una sola vez
y caduca a los 30 días.

Para dar de alta a un administrador de la plataforma hace falta una sentencia SQL
sobre `platform_admins` — deliberadamente, para que nadie pueda ascenderse desde
la aplicación.

## Formas de entrar

El tendero puede entrar de tres maneras, y **todas pasan por el mismo sitio**:
`/auth/confirmar`, que canjea el enlace del correo o el código del proveedor. Si
algo falla, cae en el acceso con el motivo en español, nunca en una página en
blanco.

| Forma | Qué necesita | Dónde aterriza |
| --- | --- | --- |
| Correo y contraseña | el código de invitación, escrito en `/registro` | el acceso, a escribir sus credenciales |
| Google, Facebook o Apple | nada, si reservaste su correo al invitarlo; si no, escribe el código después de entrar | su panel |
| Recuperar contraseña | `/recuperar` le manda un enlace a su correo | la pantalla de la contraseña nueva |

Los tres destinos son distintos a propósito:

- Al **confirmar la cuenta** se cierra la sesión que el enlace acababa de abrir y
  se le pide entrar. Confirmar el correo demuestra que la dirección es suya, no
  que quien abrió el correo sea él.
- Al **recuperar la contraseña** la sesión se mantiene, porque es justo lo que
  hace falta para poder cambiarla.
- Con un **proveedor** se entra derecho al panel: la identidad la acaba de
  comprobar Google, Facebook o Apple, y volver a pedir contraseña no tendría
  sentido cuando puede que ni tenga una.

Los dos primeros llegan por el mismo `?code=`, así que cuál fue lo dice el propio
usuario: `app_metadata.provider` vale `email` en las cuentas de correo y el nombre
del proveedor en las demás.

### Quién termina con tienda

Con Google, Facebook o Apple **no se puede mandar el código en el registro**: la
aplicación se va al proveedor y vuelve con una cuenta ya creada, sin datos
nuestros. Así que el control lo hace la base de datos de dos formas:

- **Si reservaste su correo** al crear la invitación, quien entre con ese correo
  recibe su tienda al instante, sin escribir nada. Es el camino cómodo y el
  recomendado: tú ya sabes cuál es su correo cuando lo invitas.
- **Si no**, la cuenta queda **sin tienda** y la aplicación le pide el código en
  `/registro`, que lo canjea con `canjear_invitacion`.

Una cuenta sin tienda no ve nada: todas las políticas cuelgan de `store_id`. Con
los proveedores habilitados, cualquiera con un Gmail puede crear una cuenta
vacía; no accede a nada, pero es la contrapartida de ofrecer ese botón.

### Habilitar Google, Facebook y Apple

Los botones **se muestran solos** en cuanto habilites cada proveedor: la
aplicación le pregunta a Supabase cuáles están activos, así que no hay que
desplegar nada ni tocar ninguna variable. Mientras no lo estén, no aparecen — un
botón que no funciona lleva al tendero a un error en crudo del dominio de
Supabase.

Cada proveedor exige crear una aplicación en su consola y pegar en Supabase el
*Client ID* y el *Client Secret*, en *Authentication → Sign In / Providers*. Eso
lo tienes que hacer tú: son credenciales tuyas y no deben pasar por el código.

- **Google** — en Google Cloud Console, *APIs & Services → Credentials → OAuth
  client ID*, tipo *Web application*. Gratis.
- **Facebook** — en Meta for Developers, una app tipo *Consumer* con el producto
  *Facebook Login*. Gratis, pero para salir del modo desarrollo pide política de
  privacidad publicada.
- **Apple** — exige **cuenta de desarrollador de Apple de pago** (99 USD al año).
  Si no la tienes, deja el proveedor sin habilitar y su botón simplemente no
  aparece; el resto sigue funcionando.

En los tres hay que pegar como *Redirect URI* la que muestra Supabase en la
pantalla del proveedor:

```
https://EL-PROYECTO.supabase.co/auth/v1/callback
```

### Contraseña segura

Al crear la cuenta y al cambiarla se exigen cinco cosas, y la pantalla las va
marcando mientras el tendero escribe en vez de soltarle el error al enviar:

- 8 caracteres
- una letra mayúscula
- una letra minúscula
- un número
- un signo

Las reglas viven en [`src/lib/password.ts`](src/lib/password.ts), un solo sitio
para las dos pantallas. Pero **eso es la ayuda, no la barrera**: quien llame a la
API de Supabase sin pasar por la pantalla se la salta. Hay que exigirlas también
en *Authentication → Sign In / Providers → Email*:

- **Minimum password length:** 8
- **Password Requirements:** *Lowercase, uppercase letters, digits and symbols*

Son justo las mismas cinco, para que la pantalla y la base no se contradigan.

### Ajustes de Supabase que hay que dejar puestos

En *Authentication*, una sola vez por proyecto:

1. **URL Configuration → Site URL:** el dominio de producción,
   `https://tusupermarket.vercel.app`. De fábrica viene `http://localhost:3000`, y
   ese es el valor al que Supabase manda al tendero **cuando no puede usar el
   destino que pide la aplicación**. Es el síntoma clásico: el correo llega bien,
   la cuenta se confirma bien, y el enlace lo lleva a localhost.
2. **URL Configuration → Redirect URLs:** añadir

   ```
   https://EL-DOMINIO/auth/confirmar**
   http://localhost:3000/auth/confirmar**
   ```

   El `**` del final hace falta porque el enlace de recuperación lleva
   `?next=/clave`. Sin estas entradas Supabase ignora el destino que manda
   la aplicación y devuelve al Site URL — o sea, a localhost si el paso 1 sigue
   sin hacerse.
3. **Email Templates → Confirm signup:**

   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">
     Confirmar mi cuenta
   </a>
   ```

4. **Email Templates → Reset password:**

   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">
     Poner una contraseña nueva
   </a>
   ```

   Ojo al `&` en vez de `?`: esa dirección ya lleva `?next=/clave`. Si se
   escribe de la otra forma también funciona, porque la ruta deduce el destino
   del `type=recovery`.

Las plantillas usan `{{ .RedirectTo }}` y no `{{ .SiteURL }}` porque la
aplicación manda el destino en cada petición; con `SiteURL` se perdería el
`next`.

Los pasos 3 y 4 importan más de lo que parecen. La plantilla de fábrica manda un
enlace del flujo PKCE, cuyo verificador vive en las cookies del navegador donde
se pidió: si el tendero se registra en el computador de la tienda y abre el correo
en el celular, el enlace falla. Con `TokenHash` la validación es entera del
servidor y funciona desde cualquier equipo. La ruta acepta las dos formas, así que
nada se rompe mientras las plantillas sigan sin cambiar.

Queda pendiente un **SMTP propio**: el de pruebas de Supabase manda unos pocos
correos por hora y suele caer en no deseado. Sin él, la confirmación y la
recuperación funcionan a medias en cuanto haya varias tiendas.

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
- El alta de tiendas: `store_invites` con el código y, opcional, el correo reservado; el disparador `crear_tienda_al_registrarse` y la función `canjear_invitacion` para quien entra por un proveedor.

---

Hecho con [Claude Code](https://claude.com/claude-code).
