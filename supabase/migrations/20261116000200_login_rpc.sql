-- Demo: validación de login sin exponer password_hash al cliente.
-- Las contraseñas siguen siendo texto plano en esta demo.
-- Antes de producción se debe migrar a Supabase Auth o hash real.

create or replace function public.verify_login(p_identifier text, p_password text)
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
  where (
      lower(e.usuario) = lower(p_identifier)
      or lower(e.email) = lower(p_identifier)
      or e.documento_identidad = p_identifier
    )
    and e.password_hash = p_password
  limit 1
$$;

revoke all on function public.verify_login(text, text) from public;
grant execute on function public.verify_login(text, text) to anon, authenticated;

revoke select, insert, update, delete on public.empleados from anon, authenticated;
grant select (id, id_cargo, nombres, apellidos, documento_identidad, usuario, email, estado)
  on public.empleados to anon, authenticated;
grant insert (id, id_cargo, nombres, apellidos, documento_identidad, usuario, email, password_hash, estado)
  on public.empleados to anon, authenticated;
grant update (id_cargo, nombres, apellidos, documento_identidad, usuario, email, password_hash, estado)
  on public.empleados to anon, authenticated;
