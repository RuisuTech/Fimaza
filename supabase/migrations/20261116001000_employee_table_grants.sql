-- Supabase Auth gestiona las contraseñas. El perfil público solo necesita datos de cuenta.
alter table public.empleados drop column if exists password_hash;

-- RLS sigue limitando lectura al propio perfil o al administrador.
grant select, update on public.empleados to authenticated;
