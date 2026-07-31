-- Datos de demostración para Mi Market.
--
-- Crea 6 categorías, 15 subcategorías y 24 productos de ejemplo con precios
-- en pesos colombianos, apuntando a las imágenes de `public/demo/`.
--
-- Sirve para mostrar el sistema antes de que la tienda cargue su inventario
-- real. Para dejar el catálogo en blanco de nuevo:
--
--   delete from public.products;
--   delete from public.categories;
--
-- Se ejecuta contra un proyecto Supabase que ya tenga el esquema aplicado.

with root as (
  insert into public.categories (name) values
    ('Alimentos y despensa'),
    ('Bebidas'),
    ('Lácteos y huevos'),
    ('Aseo del hogar'),
    ('Cuidado personal'),
    ('Snacks y dulces')
  returning id, name
),
sub as (
  insert into public.categories (name, parent_id)
  select s.name, r.id
  from (values
    ('Arroz y granos','Alimentos y despensa'),
    ('Aceites y salsas','Alimentos y despensa'),
    ('Enlatados','Alimentos y despensa'),
    ('Pastas','Alimentos y despensa'),
    ('Gaseosas','Bebidas'),
    ('Jugos','Bebidas'),
    ('Agua','Bebidas'),
    ('Leche','Lácteos y huevos'),
    ('Quesos','Lácteos y huevos'),
    ('Huevos','Lácteos y huevos'),
    ('Detergentes','Aseo del hogar'),
    ('Limpieza','Aseo del hogar'),
    ('Higiene personal','Cuidado personal'),
    ('Pasabocas','Snacks y dulces'),
    ('Dulces','Snacks y dulces')
  ) as s(name, parent)
  join root r on r.name = s.parent
  returning id, name
)
insert into public.products
  (name, description, brand, barcode, category_id, price, cost_price,
   discount_price, unit, stock, image_url, is_active, expires_at)
select p.name, p.description, p.brand, p.barcode, s.id,
       p.price::numeric, p.cost::numeric, p.disc::numeric,
       p.unit, p.stock::int, p.img, true, p.exp::date
from (values
  ('Arroz blanco 500 g','Grano largo, ideal para el diario.','Doña Blanca','7700000000001','Arroz y granos',3200,2600,null,'libra',40,'/demo/arroz.png','2027-04-30'),
  ('Fríjol cargamanto 500 g','Fríjol seleccionado, sin piedras.','Del Campo','7700000000002','Arroz y granos',6500,5200,null,'libra',25,'/demo/frijol.png','2027-04-30'),
  ('Lenteja 500 g','Lenteja limpia, lista para cocinar.','Del Campo','7700000000003','Arroz y granos',4200,3300,null,'libra',30,'/demo/lenteja.png','2027-04-30'),
  ('Aceite de girasol 1 L','Aceite vegetal puro para freír y aliñar.','Girasol','7700000000004','Aceites y salsas',12900,10500,null,'litro',18,'/demo/aceite.png','2027-05-10'),
  ('Salsa de tomate 200 g','Salsa de tomate natural en frasco.','Casa Rica','7700000000005','Aceites y salsas',4800,3900,4200,'unidad',22,'/demo/salsa-tomate.png','2027-02-28'),
  ('Atún en aceite 160 g','Lomitos de atún en aceite vegetal.','Mar Azul','7700000000006','Enlatados',6900,5600,null,'unidad',35,'/demo/atun.png','2028-03-01'),
  ('Fríjoles enlatados 300 g','Fríjoles cocidos listos para servir.','La Cosecha','7700000000007','Enlatados',5400,4300,null,'unidad',12,'/demo/frijol-lata.png','2027-11-20'),
  ('Espagueti 250 g','Pasta larga de trigo.','Trigal','7700000000008','Pastas',3500,2800,null,'unidad',45,'/demo/espagueti.png','2027-06-30'),
  ('Pasta corta 250 g','Pasta para sopas y ensaladas.','Trigal','7700000000009','Pastas',3500,2800,null,'unidad',0,'/demo/pasta-corta.png','2027-06-30'),
  ('Gaseosa de cola 1.5 L','Bebida gaseosa sabor cola.','Cola Real','7700000000010','Gaseosas',5500,4400,null,'unidad',28,'/demo/gaseosa-cola.png','2026-12-20'),
  ('Gaseosa de naranja 1.5 L','Bebida gaseosa sabor naranja.','Cola Real','7700000000011','Gaseosas',5500,4400,4900,'unidad',20,'/demo/gaseosa-naranja.png','2026-12-20'),
  ('Jugo de mango 1 L','Jugo de mango en caja.','Frutal','7700000000012','Jugos',4600,3700,null,'unidad',24,'/demo/jugo-mango.png','2026-09-15'),
  ('Agua sin gas 600 ml','Agua tratada, botella personal.','Manantial','7700000000013','Agua',2000,1400,null,'unidad',60,'/demo/agua.png',null),
  ('Leche entera 1 L','Leche entera larga vida.','Vaquita','7700000000014','Leche',4300,3500,null,'unidad',26,'/demo/leche.png','2026-08-06'),
  ('Queso campesino 250 g','Queso fresco del día.','Campo Fresco','7700000000015','Quesos',7800,6200,null,'unidad',10,'/demo/queso.png','2026-08-04'),
  ('Huevos AA x 12','Cubeta de doce huevos AA.','Campo Fresco','7700000000016','Huevos',12500,10200,null,'docena',15,'/demo/huevos.png','2026-08-20'),
  ('Detergente en polvo 1 kg','Detergente para ropa blanca y de color.','Brillo','7700000000017','Detergentes',9800,7900,null,'unidad',20,'/demo/detergente.png',null),
  ('Jabón lavaloza 450 g','Crema lavaplatos rendidora.','Espuma','7700000000018','Detergentes',5200,4100,null,'unidad',18,'/demo/lavaloza.png',null),
  ('Blanqueador 1 L','Blanqueador y desinfectante multiusos.','Brillo','7700000000019','Limpieza',4900,3800,null,'litro',22,'/demo/blanqueador.png',null),
  ('Papel higiénico x 4','Cuatro rollos doble hoja.','Suave','7700000000020','Higiene personal',8900,7100,null,'unidad',30,'/demo/papel.png',null),
  ('Jabón de baño 110 g','Jabón de tocador humectante.','Sonrisa','7700000000021','Higiene personal',3400,2600,null,'unidad',40,'/demo/jabon.png',null),
  ('Crema dental 100 g','Crema dental con flúor.','Sonrisa','7700000000022','Higiene personal',7200,5800,6500,'unidad',25,'/demo/crema-dental.png','2027-09-30'),
  ('Papas fritas 105 g','Papas fritas naturales con sal.','Crocante','7700000000023','Pasabocas',5900,4700,null,'unidad',35,'/demo/papas.png','2026-11-15'),
  ('Chocolatina 40 g','Chocolatina de leche.','Dulcita','7700000000024','Dulces',2500,1900,null,'unidad',50,'/demo/chocolatina.png','2026-10-30')
) as p(name, description, brand, barcode, cat, price, cost, disc, unit, stock, img, exp)
join sub s on s.name = p.cat;
