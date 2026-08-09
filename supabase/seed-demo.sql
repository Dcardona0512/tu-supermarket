-- Datos de demostración de TU SUPERMARKET.
--
-- La siembra no vive en este archivo sino en la función `reset_demo()` de la
-- base de datos, para que el botón «Restaurar la demostración» del panel y una
-- ejecución manual dejen exactamente el mismo resultado. Si estuviera duplicada
-- aquí, los dos caminos acabarían divergiendo.
--
-- Deja el sistema así:
--   · 6 categorías y 15 subcategorías
--   · 24 productos con precios en COP, imágenes de `public/demo/`, códigos de
--     barras, tres en oferta, uno agotado y dos próximos a vencer
--   · 3 pedidos de muestra, uno en cada estado:
--       #1 Carlos Ramírez  · entregado, pagado en efectivo hace unas horas
--       #2 Ana Torres      · cancelado
--       #3 María Gómez     · pendiente, listo para alistar y entregar
--
-- Las fechas son relativas al momento de ejecutarla, así que el cierre de caja
-- del día siempre tiene una venta que mostrar.
--
-- Ejecutar desde el editor SQL de Supabase:

select public.reset_demo();

-- Para dejar el catálogo completamente en blanco, sin datos de ejemplo:
--
--   delete from public.orders;
--   delete from public.stock_entries;
--   delete from public.products;
--   delete from public.categories;
