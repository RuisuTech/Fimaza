-- Módulos transaccionales de la demo Fimaza Multiplataforma.

create table if not exists public.ventas (
  id bigint primary key,
  id_cliente bigint references public.clientes(id),
  id_empleado bigint not null references public.empleados(id),
  fecha timestamptz not null default now(),
  subtotal numeric(12, 2) not null,
  igv numeric(12, 2) not null,
  total numeric(12, 2) not null,
  metodo_pago text not null default 'efectivo',
  estado text not null default 'Completada',
  comprobante text unique
);

create table if not exists public.venta_detalles (
  id bigint primary key,
  id_venta bigint not null references public.ventas(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table if not exists public.movimientos_inventario (
  id bigint primary key,
  id_variante bigint not null references public.producto_variantes(id),
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad integer not null check (cantidad > 0),
  motivo text,
  referencia text,
  id_empleado bigint references public.empleados(id),
  fecha timestamptz not null default now()
);

create table if not exists public.guias_salida (
  id bigint primary key,
  numero text not null unique,
  fecha date not null,
  motivo text not null,
  referencia text,
  id_empleado bigint not null references public.empleados(id),
  estado text not null default 'Emitida'
);

create table if not exists public.guia_salida_detalles (
  id bigint primary key,
  id_guia bigint not null references public.guias_salida(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad integer not null check (cantidad > 0)
);

create table if not exists public.guias_entrada (
  id bigint primary key,
  numero text not null unique,
  fecha date not null,
  id_orden_compra bigint,
  id_proveedor bigint not null references public.proveedores(id),
  observaciones text,
  estado text not null default 'Registrada'
);

create table if not exists public.guia_entrada_detalles (
  id bigint primary key,
  id_guia bigint not null references public.guias_entrada(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad_esperada integer not null check (cantidad_esperada >= 0),
  cantidad_recibida integer not null check (cantidad_recibida >= 0)
);

create table if not exists public.pedidos_compra (
  id bigint primary key,
  numero text not null unique,
  id_proveedor bigint not null references public.proveedores(id),
  fecha date not null,
  fecha_requerida date,
  total numeric(12, 2) not null default 0,
  estado text not null default 'Borrador'
);

create table if not exists public.pedido_compra_detalles (
  id bigint primary key,
  id_pedido bigint not null references public.pedidos_compra(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table if not exists public.cotizaciones_compra (
  id bigint primary key,
  numero text not null unique,
  id_proveedor bigint not null references public.proveedores(id),
  fecha date not null,
  valida_hasta date,
  total numeric(12, 2) not null default 0,
  estado text not null default 'Pendiente'
);

create table if not exists public.cotizacion_detalles (
  id bigint primary key,
  id_cotizacion bigint not null references public.cotizaciones_compra(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table if not exists public.ordenes_compra (
  id bigint primary key,
  numero text not null unique,
  id_cotizacion bigint references public.cotizaciones_compra(id),
  id_proveedor bigint not null references public.proveedores(id),
  fecha date not null,
  subtotal numeric(12, 2) not null,
  igv numeric(12, 2) not null,
  total numeric(12, 2) not null,
  estado text not null default 'Emitida'
);

create table if not exists public.orden_compra_detalles (
  id bigint primary key,
  id_orden bigint not null references public.ordenes_compra(id) on delete cascade,
  id_variante bigint not null references public.producto_variantes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table if not exists public.facturas_compra (
  id bigint primary key,
  serie text not null,
  numero text not null,
  id_orden_compra bigint references public.ordenes_compra(id),
  id_proveedor bigint not null references public.proveedores(id),
  fecha_emision date not null,
  fecha_vencimiento date,
  monto numeric(12, 2) not null,
  estado text not null default 'Pendiente',
  constraint facturas_compra_numero_unique unique (serie, numero)
);

create index if not exists idx_ventas_cliente on public.ventas(id_cliente);
create index if not exists idx_venta_detalles_venta on public.venta_detalles(id_venta);
create index if not exists idx_movimientos_variante on public.movimientos_inventario(id_variante);
create index if not exists idx_guia_salida_detalles_guia on public.guia_salida_detalles(id_guia);
create index if not exists idx_guia_entrada_detalles_guia on public.guia_entrada_detalles(id_guia);
create index if not exists idx_pedido_detalles_pedido on public.pedido_compra_detalles(id_pedido);
create index if not exists idx_cotizacion_detalles_cotizacion on public.cotizacion_detalles(id_cotizacion);
create index if not exists idx_orden_detalles_orden on public.orden_compra_detalles(id_orden);

insert into public.proveedores (id, ruc, razon_social, telefono, direccion, email) values
  (1, '20123456789', 'Calzado Andino S.A.C.', '987 654 321', 'Av. Los Andes 245, Lima', 'proveedor1@ejemplo.com'),
  (2, '20456789123', 'Importaciones Pacífico E.I.R.L.', '956 123 456', 'Jr. Comercio 812, Trujillo', 'proveedor2@ejemplo.com'),
  (3, '20987654321', 'Distribuidora Lima Norte S.A.C.', '912 345 678', 'Av. Perú 1560, Lima', 'proveedor3@ejemplo.com')
on conflict (id) do nothing;

insert into public.clientes (id, tipo_documento, numero_documento, nombres_razon_social, telefono, correo) values
  (1, 'DNI', '00000000', 'Cliente de ejemplo', '900 000 001', 'cliente@ejemplo.com'),
  (2, 'DNI', '45678912', 'María Fernández', '900 000 002', 'maria@ejemplo.com'),
  (3, 'RUC', '20567891234', 'Comercial San Juan S.A.C.', '900 000 003', 'ventas@sanjuan.com')
on conflict (id) do nothing;

insert into public.productos (id, id_marca, id_categoria, id_genero, nombre, descripcion, estado) values
  (1001, 1, 1, 1, 'Air Max 90', 'Zapatilla running', true),
  (1002, 2, 2, 3, 'Superstar', 'Zapatilla casual', true),
  (1003, 3, 2, 1, '574 Classic', 'Zapatilla casual', true),
  (1004, 4, 2, 3, 'RS-X', 'Zapatilla casual', true)
on conflict (id) do nothing;

insert into public.producto_variantes
  (id, id_producto, id_talla, id_color, codigo_barras, precio_compra, precio_venta)
values
  (2001, 1001, 6, 1, 'AM90-40-NEG', 180.00, 299.90),
  (2002, 1001, 7, 2, 'AM90-41-BLA', 180.00, 299.90),
  (2003, 1002, 4, 1, 'SUP-38-NEG', 150.00, 249.90),
  (2004, 1002, 5, 2, 'SUP-39-BLA', 150.00, 249.90),
  (2005, 1003, 8, 6, 'NB574-42-GRI', 190.00, 279.90),
  (2006, 1004, 5, 4, 'RSX-39-AZU', 170.00, 259.90)
on conflict (id) do nothing;

insert into public.inventario (id, id_variante, stock_actual, stock_minimo) values
  (3001, 2001, 12, 5),
  (3002, 2002, 8, 4),
  (3003, 2003, 3, 8),
  (3004, 2004, 6, 4),
  (3005, 2005, 10, 5),
  (3006, 2006, 2, 6)
on conflict (id) do nothing;

insert into public.cotizaciones_compra (id, numero, id_proveedor, fecha, valida_hasta, total, estado) values
  (4001, 'COT-0001', 1, '2026-11-12', '2026-11-30', 4490.00, 'Aceptada'),
  (4002, 'COT-0002', 2, '2026-11-11', '2026-11-28', 3120.50, 'Pendiente'),
  (4003, 'COT-0003', 3, '2026-11-10', '2026-11-25', 1780.00, 'Rechazada')
on conflict (id) do nothing;

insert into public.cotizacion_detalles
  (id, id_cotizacion, id_variante, cantidad, precio_unitario, subtotal)
values
  (4101, 4001, 2001, 10, 200.00, 2000.00),
  (4102, 4001, 2003, 8, 150.00, 1200.00),
  (4103, 4001, 2005, 6, 215.00, 1290.00),
  (4104, 4002, 2002, 6, 180.00, 1080.00),
  (4105, 4002, 2004, 8, 170.00, 1360.00),
  (4106, 4002, 2006, 3, 226.83, 680.50),
  (4107, 4003, 2001, 4, 200.00, 800.00),
  (4108, 4003, 2003, 4, 150.00, 600.00),
  (4109, 4003, 2005, 2, 190.00, 380.00)
on conflict (id) do nothing;

insert into public.pedidos_compra
  (id, numero, id_proveedor, fecha, fecha_requerida, total, estado)
values
  (5001, 'PC-0005', 1, '2026-11-12', '2026-11-20', 4490.00, 'Atendido'),
  (5002, 'PC-0004', 2, '2026-11-10', '2026-11-18', 3120.50, 'Enviado'),
  (5003, 'PC-0003', 3, '2026-11-08', '2026-11-16', 2780.00, 'Borrador')
on conflict (id) do nothing;

insert into public.pedido_compra_detalles
  (id, id_pedido, id_variante, cantidad, precio_unitario, subtotal)
values
  (5101, 5001, 2001, 10, 200.00, 2000.00),
  (5102, 5001, 2003, 8, 150.00, 1200.00),
  (5103, 5001, 2005, 6, 215.00, 1290.00)
on conflict (id) do nothing;

insert into public.ordenes_compra
  (id, numero, id_cotizacion, id_proveedor, fecha, subtotal, igv, total, estado)
values
  (6001, 'OC-0003', 4001, 1, '2026-11-12', 3290.00, 592.20, 3882.20, 'Emitida'),
  (6002, 'OC-0002', 4002, 2, '2026-11-10', 2450.00, 441.00, 2891.00, 'Recibida'),
  (6003, 'OC-0001', 4003, 3, '2026-11-08', 1508.47, 271.53, 1780.00, 'Recibida')
on conflict (id) do nothing;

insert into public.orden_compra_detalles
  (id, id_orden, id_variante, cantidad, precio_unitario, subtotal)
values
  (6101, 6001, 2001, 8, 180.00, 1440.00),
  (6102, 6001, 2003, 6, 150.00, 900.00),
  (6103, 6001, 2005, 5, 190.00, 950.00)
on conflict (id) do nothing;

insert into public.facturas_compra
  (id, serie, numero, id_orden_compra, id_proveedor, fecha_emision, fecha_vencimiento, monto, estado)
values
  (7001, 'F001', '000045', 6001, 1, '2026-11-12', '2026-11-30', 3882.20, 'Pendiente'),
  (7002, 'F001', '000044', 6002, 2, '2026-11-10', '2026-11-25', 2891.00, 'Pagada'),
  (7003, 'F001', '000043', 6003, 3, '2026-11-08', '2026-11-20', 1780.00, 'Vencida')
on conflict (id) do nothing;

insert into public.ventas
  (id, id_cliente, id_empleado, fecha, subtotal, igv, total, metodo_pago, estado, comprobante)
values
  (8001, 1, 1, now() - interval '1 day', 549.80, 98.96, 648.76, 'efectivo', 'Completada', 'B001-00000001'),
  (8002, 2, 1, now() - interval '2 days', 529.80, 95.36, 625.16, 'tarjeta', 'Completada', 'B001-00000002'),
  (8003, 1, 2, now(), 259.90, 46.78, 306.68, 'yape', 'Completada', 'B001-00000003')
on conflict (id) do nothing;

insert into public.venta_detalles
  (id, id_venta, id_variante, cantidad, precio_unitario, subtotal)
values
  (8101, 8001, 2001, 1, 299.90, 299.90),
  (8102, 8001, 2003, 1, 249.90, 249.90),
  (8103, 8002, 2005, 1, 279.90, 279.90),
  (8104, 8002, 2003, 1, 249.90, 249.90),
  (8105, 8003, 2006, 1, 259.90, 259.90)
on conflict (id) do nothing;

grant select, insert, update, delete on public.ventas to anon, authenticated;
grant select, insert, update, delete on public.venta_detalles to anon, authenticated;
grant select, insert, update, delete on public.movimientos_inventario to anon, authenticated;
grant select, insert, update, delete on public.guias_salida to anon, authenticated;
grant select, insert, update, delete on public.guia_salida_detalles to anon, authenticated;
grant select, insert, update, delete on public.guias_entrada to anon, authenticated;
grant select, insert, update, delete on public.guia_entrada_detalles to anon, authenticated;
grant select, insert, update, delete on public.pedidos_compra to anon, authenticated;
grant select, insert, update, delete on public.pedido_compra_detalles to anon, authenticated;
grant select, insert, update, delete on public.cotizaciones_compra to anon, authenticated;
grant select, insert, update, delete on public.cotizacion_detalles to anon, authenticated;
grant select, insert, update, delete on public.ordenes_compra to anon, authenticated;
grant select, insert, update, delete on public.orden_compra_detalles to anon, authenticated;
grant select, insert, update, delete on public.facturas_compra to anon, authenticated;
