-- Transiciones de estado y auditoría server-side.

alter table public.ventas drop constraint if exists ventas_estado_check;
alter table public.ventas add constraint ventas_estado_check
  check (estado in ('Completada', 'Anulada'));

alter table public.guias_salida drop constraint if exists guias_salida_estado_check;
alter table public.guias_salida add constraint guias_salida_estado_check
  check (estado in ('Emitida', 'Anulada'));

alter table public.guias_entrada drop constraint if exists guias_entrada_estado_check;
alter table public.guias_entrada add constraint guias_entrada_estado_check
  check (estado in ('Registrada'));

alter table public.pedidos_compra drop constraint if exists pedidos_compra_estado_check;
alter table public.pedidos_compra add constraint pedidos_compra_estado_check
  check (estado in ('Borrador', 'Enviado', 'Atendido'));

alter table public.cotizaciones_compra drop constraint if exists cotizaciones_compra_estado_check;
alter table public.cotizaciones_compra add constraint cotizaciones_compra_estado_check
  check (estado in ('Pendiente', 'Aceptada', 'Rechazada'));

alter table public.ordenes_compra drop constraint if exists ordenes_compra_estado_check;
alter table public.ordenes_compra add constraint ordenes_compra_estado_check
  check (estado in ('Emitida', 'Recibida', 'Pagada'));

alter table public.facturas_compra drop constraint if exists facturas_compra_estado_check;
alter table public.facturas_compra add constraint facturas_compra_estado_check
  check (estado in ('Pendiente', 'Pagada', 'Vencida'));

create or replace function public.sync_entry_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id_orden_compra is not null then
    update public.ordenes_compra
    set estado = 'Recibida'
    where id = new.id_orden_compra
      and estado = 'Emitida';
  end if;
  return new;
end;
$$;

drop trigger if exists sync_entry_order_status on public.guias_entrada;
create trigger sync_entry_order_status
after insert on public.guias_entrada
for each row execute function public.sync_entry_order_status();

create or replace function public.sync_invoice_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'Pagada' and new.id_orden_compra is not null then
    update public.ordenes_compra
    set estado = 'Pagada'
    where id = new.id_orden_compra
      and estado in ('Emitida', 'Recibida');
  end if;
  return new;
end;
$$;

drop trigger if exists sync_invoice_order_status on public.facturas_compra;
create trigger sync_invoice_order_status
after insert or update on public.facturas_compra
for each row execute function public.sync_invoice_order_status();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id bigint := public.current_employee_id();
begin
  if v_employee_id is null then
    return new;
  end if;

  insert into public.auditoria_sesion
    (id, id_empleado, tipo_accion, detalle, fecha)
  values
    (
      public.app_next_id(),
      v_employee_id,
      TG_TABLE_NAME || '_' || TG_OP,
      left(row_to_json(new)::text, 1000),
      now()
    );

  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ventas', 'guias_salida', 'guias_entrada',
    'pedidos_compra', 'cotizaciones_compra',
    'ordenes_compra', 'facturas_compra'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'audit_' || t, t);
    execute format(
      'create trigger %I after insert or update on public.%I for each row execute function public.audit_row_change()',
      'audit_' || t,
      t
    );
  end loop;
end $$;
