-- Fimaza Multiplataforma - esquema inicial para demo en Supabase.
-- Demo: RLS desactivado a propósito. Antes de producción se deben crear políticas.

create table if not exists public.cargos (
  id bigint primary key,
  nombre_cargo text not null,
  descripcion text,
  estado boolean not null default true
);

create table if not exists public.marcas (
  id bigint primary key,
  nombre_marca text not null unique,
  estado boolean not null default true
);

create table if not exists public.categorias (
  id bigint primary key,
  nombre_categoria text not null unique,
  descripcion text
);

create table if not exists public.generos (
  id bigint primary key,
  nombre_genero text not null unique,
  estado boolean not null default true
);

create table if not exists public.tallas (
  id bigint primary key,
  numero_talla text not null unique
);

create table if not exists public.colores (
  id bigint primary key,
  nombre_color text not null unique
);

create table if not exists public.clientes (
  id bigint primary key,
  tipo_documento text not null,
  numero_documento text not null,
  nombres_razon_social text not null,
  telefono text,
  correo text,
  constraint clientes_documento_unique unique (tipo_documento, numero_documento)
);

create table if not exists public.proveedores (
  id bigint primary key,
  ruc text not null unique,
  razon_social text not null,
  telefono text,
  direccion text,
  email text
);

create table if not exists public.empleados (
  id bigint primary key,
  id_cargo bigint not null references public.cargos(id),
  nombres text not null,
  apellidos text not null,
  documento_identidad text not null unique,
  usuario text unique,
  email text unique,
  password_hash text not null,
  estado boolean not null default true
);

create table if not exists public.productos (
  id bigint primary key,
  id_marca bigint not null references public.marcas(id),
  id_categoria bigint not null references public.categorias(id),
  id_genero bigint not null references public.generos(id),
  nombre text not null,
  descripcion text,
  estado boolean not null default true
);

create table if not exists public.producto_variantes (
  id bigint primary key,
  id_producto bigint not null references public.productos(id) on delete cascade,
  id_talla bigint not null references public.tallas(id),
  id_color bigint not null references public.colores(id),
  codigo_barras text unique,
  precio_compra numeric(12, 2) not null default 0,
  precio_venta numeric(12, 2) not null,
  constraint producto_variantes_combinacion_unique unique (id_producto, id_talla, id_color)
);

create table if not exists public.inventario (
  id bigint primary key,
  id_variante bigint not null unique references public.producto_variantes(id) on delete cascade,
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0)
);

create table if not exists public.auditoria_sesion (
  id bigint primary key,
  id_empleado bigint not null references public.empleados(id),
  tipo_accion text not null,
  detalle text not null,
  fecha timestamptz not null default now()
);

create index if not exists idx_empleados_cargo on public.empleados(id_cargo);
create index if not exists idx_productos_marca on public.productos(id_marca);
create index if not exists idx_productos_categoria on public.productos(id_categoria);
create index if not exists idx_productos_genero on public.productos(id_genero);
create index if not exists idx_variantes_producto on public.producto_variantes(id_producto);
create index if not exists idx_inventario_variante on public.inventario(id_variante);
create index if not exists idx_auditoria_empleado on public.auditoria_sesion(id_empleado);

insert into public.cargos (id, nombre_cargo, descripcion, estado) values
  (1, 'Administrador', 'Acceso completo al sistema', true),
  (2, 'Vendedor', 'Registro de ventas y consulta de inventario', true),
  (3, 'Almacenero', 'Gestion de inventario', true)
on conflict (id) do nothing;

insert into public.marcas (id, nombre_marca, estado) values
  (1, 'Nike', true),
  (2, 'Adidas', true),
  (3, 'New Balance', true),
  (4, 'Puma', true),
  (5, 'Reebok', true),
  (6, 'Converse', true),
  (7, 'Vans', true),
  (8, 'Under Armour', true)
on conflict (id) do nothing;

insert into public.categorias (id, nombre_categoria, descripcion) values
  (1, 'Running', 'Zapatillas para correr'),
  (2, 'Casual', 'Uso diario'),
  (3, 'Basketball', 'Baloncesto'),
  (4, 'Football', 'Futbol'),
  (5, 'Training', 'Entrenamiento'),
  (6, 'Skate', 'Skateboarding')
on conflict (id) do nothing;

insert into public.generos (id, nombre_genero, estado) values
  (1, 'Hombre', true),
  (2, 'Mujer', true),
  (3, 'Unisex', true),
  (4, 'Niño', true),
  (5, 'Niña', true)
on conflict (id) do nothing;

insert into public.tallas (id, numero_talla) values
  (1, '35'), (2, '36'), (3, '37'), (4, '38'), (5, '39'), (6, '40'),
  (7, '41'), (8, '42'), (9, '43'), (10, '44'), (11, '45')
on conflict (id) do nothing;

insert into public.colores (id, nombre_color) values
  (1, 'Negro'), (2, 'Blanco'), (3, 'Rojo'), (4, 'Azul'), (5, 'Verde'),
  (6, 'Gris'), (7, 'Rosa'), (8, 'Naranja'), (9, 'Beige')
on conflict (id) do nothing;

insert into public.empleados
  (id, id_cargo, nombres, apellidos, documento_identidad, usuario, email, password_hash, estado)
values
  (1, 1, 'Usuario', 'Admin', '12345678', 'admin', 'admin@fimaza.com', 'supabase-auth', true),
  (2, 2, 'Usuario', 'Vendedor', '87654321', 'vendedora01', 'user@fimaza.com', 'supabase-auth', true)
on conflict (id) do update set
  id_cargo = excluded.id_cargo,
  nombres = excluded.nombres,
  apellidos = excluded.apellidos,
  documento_identidad = excluded.documento_identidad,
  usuario = excluded.usuario,
  email = excluded.email,
  password_hash = excluded.password_hash,
  estado = excluded.estado;

alter table public.cargos disable row level security;
alter table public.marcas disable row level security;
alter table public.categorias disable row level security;
alter table public.generos disable row level security;
alter table public.tallas disable row level security;
alter table public.colores disable row level security;
alter table public.clientes disable row level security;
alter table public.proveedores disable row level security;
alter table public.empleados disable row level security;
alter table public.productos disable row level security;
alter table public.producto_variantes disable row level security;
alter table public.inventario disable row level security;
alter table public.auditoria_sesion disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
