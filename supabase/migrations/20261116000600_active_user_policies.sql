-- Endurece RLS: un usuario desactivado no puede leer datos aunque conserve sesión.

grant execute on function public.is_active_user() to authenticated;

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
      'create policy %I on public.%I for select to authenticated using (public.is_active_user())',
      'auth_read_' || t,
      t
    );
  end loop;
end $$;

drop policy if exists "employees_read_own_or_admin" on public.empleados;
create policy "employees_read_own_or_admin"
on public.empleados
for select
to authenticated
using (
  (auth_user_id = auth.uid() and public.is_active_user())
  or public.is_admin()
);
