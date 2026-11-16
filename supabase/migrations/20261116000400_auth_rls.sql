-- Migración a Supabase Auth + RLS por rol.

alter table public.empleados add column if not exists auth_user_id uuid unique;
alter table public.empleados alter column password_hash drop not null;

update public.empleados e
set auth_user_id = u.id,
    password_hash = null
from auth.users u
where e.email = u.email
  and e.auth_user_id is null;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empleados e
    where e.auth_user_id = auth.uid()
      and e.id_cargo = 1
      and e.estado = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.get_my_profile()
returns table (
  id bigint,
  id_cargo bigint,
  nombres text,
  apellidos text,
  documento_identidad text,
  usuario text,
  email text,
  estado boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.id_cargo,
    e.nombres,
    e.apellidos,
    e.documento_identidad,
    e.usuario,
    e.email,
    e.estado
  from public.empleados e
  where e.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

create or replace function public.resolve_login_email(p_identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e.email
  from public.empleados e
  where e.auth_user_id is not null
    and e.estado = true
    and (
      lower(e.usuario) = lower(p_identifier)
      or lower(e.email) = lower(p_identifier)
      or e.documento_identidad = p_identifier
    )
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

drop function if exists public.verify_login(text, text);

do $$
declare
  t text;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'admin_all_' || t, t);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'cargos', 'marcas', 'categorias', 'generos', 'tallas', 'colores',
    'clientes', 'proveedores', 'productos', 'producto_variantes', 'inventario'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'auth_read_' || t, t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      'auth_read_' || t,
      t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      'admin_all_' || t,
      t
    );
  end loop;

  foreach t in array array[
    'ventas', 'venta_detalles', 'movimientos_inventario',
    'guias_salida', 'guia_salida_detalles',
    'guias_entrada', 'guia_entrada_detalles',
    'pedidos_compra', 'pedido_compra_detalles',
    'cotizaciones_compra', 'cotizacion_detalles',
    'ordenes_compra', 'orden_compra_detalles',
    'facturas_compra', 'auditoria_sesion'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      'admin_all_' || t,
      t
    );
  end loop;
end $$;

drop policy if exists "employees_read_own_or_admin" on public.empleados;
create policy "employees_read_own_or_admin"
on public.empleados
for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "employees_admin_write" on public.empleados;
create policy "employees_admin_write"
on public.empleados
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
