-- RPCs transaccionales para ventas, almacén y compras.

create sequence if not exists public.app_id_seq start with 1000000000000 increment by 1;
create sequence if not exists public.seq_comprobante start with 4 increment by 1;
create sequence if not exists public.seq_cotizacion start with 4 increment by 1;
create sequence if not exists public.seq_pedido start with 6 increment by 1;
create sequence if not exists public.seq_orden start with 4 increment by 1;

select setval(
  'public.seq_comprobante',
  greatest(4, coalesce((select max(substring(comprobante from '[0-9]+$')::bigint) from public.ventas), 0) + 1),
  false
);
select setval(
  'public.seq_cotizacion',
  greatest(4, coalesce((select max(substring(numero from '[0-9]+$')::bigint) from public.cotizaciones_compra), 0) + 1),
  false
);
select setval(
  'public.seq_pedido',
  greatest(6, coalesce((select max(substring(numero from '[0-9]+$')::bigint) from public.pedidos_compra), 0) + 1),
  false
);
select setval(
  'public.seq_orden',
  greatest(4, coalesce((select max(substring(numero from '[0-9]+$')::bigint) from public.ordenes_compra), 0) + 1),
  false
);

create or replace function public.app_next_id()
returns bigint
language sql
volatile
as $$
  select nextval('public.app_id_seq');
$$;

revoke all on function public.app_next_id() from public;

create or replace function public.current_employee_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.empleados e
  where e.auth_user_id = auth.uid()
    and e.estado = true
  limit 1;
$$;

revoke all on function public.current_employee_id() from public;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_employee_id() is not null;
$$;

revoke all on function public.is_active_user() from public;

create or replace function public.create_sale(
  p_client_id bigint,
  p_items jsonb,
  p_metodo_pago text default 'efectivo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id bigint := public.current_employee_id();
  v_item jsonb;
  v_stock public.inventario%rowtype;
  v_subtotal numeric(12,2) := 0;
  v_igv numeric(12,2);
  v_total numeric(12,2);
  v_sale_id bigint;
  v_comprobante text;
  v_qty integer;
  v_price numeric(12,2);
  v_detail_id bigint;
  v_movement_id bigint;
begin
  if v_employee_id is null then
    raise exception 'Usuario no autorizado o inactivo';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    if v_qty is null or v_qty <= 0 or v_price is null or v_price <= 0 then
      raise exception 'Cantidad o precio inválido';
    end if;

    select *
    into v_stock
    from public.inventario
    where id_variante = (v_item->>'variant_id')::bigint
    for update;

    if not found then
      raise exception 'Inventario no encontrado para la variante %', v_item->>'variant_id';
    end if;
    if v_stock.stock_actual < v_qty then
      raise exception 'Stock insuficiente para la variante %', v_item->>'variant_id';
    end if;

    v_subtotal := v_subtotal + (v_qty * v_price);
  end loop;

  v_igv := round(v_subtotal * 0.18, 2);
  v_total := v_subtotal + v_igv;
  v_sale_id := public.app_next_id();
  v_comprobante := 'B001-' || lpad(nextval('public.seq_comprobante')::text, 8, '0');

  insert into public.ventas
    (id, id_cliente, id_empleado, fecha, subtotal, igv, total, metodo_pago, estado, comprobante)
  values
    (v_sale_id, p_client_id, v_employee_id, now(), v_subtotal, v_igv, v_total, p_metodo_pago, 'Completada', v_comprobante);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    v_detail_id := public.app_next_id();
    v_movement_id := public.app_next_id();

    insert into public.venta_detalles
      (id, id_venta, id_variante, cantidad, precio_unitario, subtotal)
    values
      (v_detail_id, v_sale_id, (v_item->>'variant_id')::bigint, v_qty, v_price, v_qty * v_price);

    update public.inventario
    set stock_actual = stock_actual - v_qty
    where id_variante = (v_item->>'variant_id')::bigint;

    insert into public.movimientos_inventario
      (id, id_variante, tipo, cantidad, motivo, referencia, id_empleado)
    values
      (v_movement_id, (v_item->>'variant_id')::bigint, 'salida', v_qty, 'Venta', v_comprobante, v_employee_id);
  end loop;

  return jsonb_build_object(
    'id', v_sale_id,
    'id_cliente', p_client_id,
    'id_empleado', v_employee_id,
    'fecha', now(),
    'subtotal', v_subtotal,
    'igv', v_igv,
    'total', v_total,
    'metodo_pago', p_metodo_pago,
    'estado', 'Completada',
    'comprobante', v_comprobante
  );
end;
$$;

revoke all on function public.create_sale(bigint, jsonb, text) from public;
grant execute on function public.create_sale(bigint, jsonb, text) to authenticated;

create or replace function public.create_exit_guide(
  p_numero text,
  p_fecha date,
  p_motivo text,
  p_referencia text,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id bigint := public.current_employee_id();
  v_guide_id bigint;
  v_item jsonb;
  v_stock public.inventario%rowtype;
  v_qty integer;
  v_line_id bigint;
  v_movement_id bigint;
begin
  if v_employee_id is null then
    raise exception 'Usuario no autorizado o inactivo';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;
    select *
    into v_stock
    from public.inventario
    where id_variante = (v_item->>'variant_id')::bigint
    for update;
    if not found then
      raise exception 'Inventario no encontrado';
    end if;
    if v_stock.stock_actual < v_qty then
      raise exception 'Stock insuficiente para la variante %', v_item->>'variant_id';
    end if;
  end loop;

  v_guide_id := public.app_next_id();
  insert into public.guias_salida
    (id, numero, fecha, motivo, referencia, id_empleado, estado)
  values
    (v_guide_id, p_numero, p_fecha, p_motivo, p_referencia, v_employee_id, 'Emitida');

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_line_id := public.app_next_id();
    v_movement_id := public.app_next_id();

    insert into public.guia_salida_detalles
      (id, id_guia, id_variante, cantidad)
    values
      (v_line_id, v_guide_id, (v_item->>'variant_id')::bigint, v_qty);

    update public.inventario
    set stock_actual = stock_actual - v_qty
    where id_variante = (v_item->>'variant_id')::bigint;

    insert into public.movimientos_inventario
      (id, id_variante, tipo, cantidad, motivo, referencia, id_empleado)
    values
      (v_movement_id, (v_item->>'variant_id')::bigint, 'salida', v_qty, p_motivo, p_numero, v_employee_id);
  end loop;

  return jsonb_build_object('id', v_guide_id, 'numero', p_numero, 'estado', 'Emitida');
end;
$$;

revoke all on function public.create_exit_guide(text, date, text, text, jsonb) from public;
grant execute on function public.create_exit_guide(text, date, text, text, jsonb) to authenticated;

create or replace function public.create_entry_guide(
  p_numero text,
  p_fecha date,
  p_order_id bigint,
  p_provider_id bigint,
  p_observaciones text,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id bigint := public.current_employee_id();
  v_guide_id bigint;
  v_item jsonb;
  v_stock public.inventario%rowtype;
  v_expected integer;
  v_received integer;
  v_line_id bigint;
  v_movement_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar entradas';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'No hay mercadería para registrar';
  end if;

  v_guide_id := public.app_next_id();
  insert into public.guias_entrada
    (id, numero, fecha, id_orden_compra, id_proveedor, observaciones, estado)
  values
    (v_guide_id, p_numero, p_fecha, p_order_id, p_provider_id, p_observaciones, 'Registrada');

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_expected := coalesce((v_item->>'cantidad_esperada')::integer, 0);
    v_received := coalesce((v_item->>'cantidad_recibida')::integer, 0);
    if v_expected < 0 or v_received < 0 then
      raise exception 'Cantidades inválidas';
    end if;

    v_line_id := public.app_next_id();
    insert into public.guia_entrada_detalles
      (id, id_guia, id_variante, cantidad_esperada, cantidad_recibida)
    values
      (v_line_id, v_guide_id, (v_item->>'variant_id')::bigint, v_expected, v_received);

    if v_received > 0 then
      select *
      into v_stock
      from public.inventario
      where id_variante = (v_item->>'variant_id')::bigint
      for update;

      if not found then
        insert into public.inventario
          (id, id_variante, stock_actual, stock_minimo)
        values
          (public.app_next_id(), (v_item->>'variant_id')::bigint, v_received, 0);
      else
        update public.inventario
        set stock_actual = stock_actual + v_received
        where id_variante = (v_item->>'variant_id')::bigint;
      end if;

      v_movement_id := public.app_next_id();
      insert into public.movimientos_inventario
        (id, id_variante, tipo, cantidad, motivo, referencia, id_empleado)
      values
        (v_movement_id, (v_item->>'variant_id')::bigint, 'entrada', v_received, 'Recepción', p_numero, v_employee_id);
    end if;
  end loop;

  return jsonb_build_object('id', v_guide_id, 'numero', p_numero, 'estado', 'Registrada');
end;
$$;

revoke all on function public.create_entry_guide(text, date, bigint, bigint, text, jsonb) from public;
grant execute on function public.create_entry_guide(text, date, bigint, bigint, text, jsonb) to authenticated;

create or replace function public.create_purchase_order(
  p_provider_id bigint,
  p_fecha date,
  p_required_date date,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
  v_item jsonb;
  v_qty integer;
  v_price numeric(12,2);
  v_total numeric(12,2) := 0;
  v_line_id bigint;
  v_numero text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear pedidos';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'Agrega al menos una línea';
  end if;

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    if v_qty is null or v_qty <= 0 or v_price is null or v_price < 0 then
      raise exception 'Cantidad o precio inválido';
    end if;
    v_total := v_total + (v_qty * v_price);
  end loop;

  v_order_id := public.app_next_id();
  v_numero := 'PC-' || lpad(nextval('public.seq_pedido')::text, 4, '0');
  insert into public.pedidos_compra
    (id, numero, id_proveedor, fecha, fecha_requerida, total, estado)
  values
    (v_order_id, v_numero, p_provider_id, p_fecha, p_required_date, v_total, 'Borrador');

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    v_line_id := public.app_next_id();
    insert into public.pedido_compra_detalles
      (id, id_pedido, id_variante, cantidad, precio_unitario, subtotal)
    values
      (v_line_id, v_order_id, (v_item->>'variant_id')::bigint, v_qty, v_price, v_qty * v_price);
  end loop;

  return jsonb_build_object('id', v_order_id, 'numero', v_numero, 'total', v_total);
end;
$$;

revoke all on function public.create_purchase_order(bigint, date, date, jsonb) from public;
grant execute on function public.create_purchase_order(bigint, date, date, jsonb) to authenticated;

create or replace function public.create_quote(
  p_provider_id bigint,
  p_fecha date,
  p_valid_until date,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote_id bigint;
  v_item jsonb;
  v_qty integer;
  v_price numeric(12,2);
  v_total numeric(12,2) := 0;
  v_line_id bigint;
  v_numero text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear cotizaciones';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'Agrega al menos una línea';
  end if;

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    if v_qty is null or v_qty <= 0 or v_price is null or v_price < 0 then
      raise exception 'Cantidad o precio inválido';
    end if;
    v_total := v_total + (v_qty * v_price);
  end loop;

  v_quote_id := public.app_next_id();
  v_numero := 'COT-' || lpad(nextval('public.seq_cotizacion')::text, 4, '0');
  insert into public.cotizaciones_compra
    (id, numero, id_proveedor, fecha, valida_hasta, total, estado)
  values
    (v_quote_id, v_numero, p_provider_id, p_fecha, p_valid_until, v_total, 'Pendiente');

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_item->>'cantidad')::integer;
    v_price := (v_item->>'precio_unitario')::numeric;
    v_line_id := public.app_next_id();
    insert into public.cotizacion_detalles
      (id, id_cotizacion, id_variante, cantidad, precio_unitario, subtotal)
    values
      (v_line_id, v_quote_id, (v_item->>'variant_id')::bigint, v_qty, v_price, v_qty * v_price);
  end loop;

  return jsonb_build_object('id', v_quote_id, 'numero', v_numero, 'total', v_total);
end;
$$;

revoke all on function public.create_quote(bigint, date, date, jsonb) from public;
grant execute on function public.create_quote(bigint, date, date, jsonb) to authenticated;

create or replace function public.create_order_from_quote(
  p_quote_id bigint,
  p_numero text default null,
  p_fecha date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote public.cotizaciones_compra%rowtype;
  v_detail public.cotizacion_detalles%rowtype;
  v_order_id bigint;
  v_numero text;
  v_subtotal numeric(12,2) := 0;
  v_igv numeric(12,2);
  v_total numeric(12,2);
  v_line_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede emitir órdenes';
  end if;

  select * into v_quote from public.cotizaciones_compra where id = p_quote_id;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;

  select coalesce(sum(subtotal), 0)
  into v_subtotal
  from public.cotizacion_detalles
  where id_cotizacion = p_quote_id;

  if v_subtotal = 0 then
    raise exception 'La cotización no tiene líneas';
  end if;

  v_igv := round(v_subtotal * 0.18, 2);
  v_total := v_subtotal + v_igv;
  v_order_id := public.app_next_id();
  v_numero := coalesce(p_numero, 'OC-' || lpad(nextval('public.seq_orden')::text, 4, '0'));

  insert into public.ordenes_compra
    (id, numero, id_cotizacion, id_proveedor, fecha, subtotal, igv, total, estado)
  values
    (v_order_id, v_numero, p_quote_id, v_quote.id_proveedor, p_fecha, v_subtotal, v_igv, v_total, 'Emitida');

  for v_detail in
    select * from public.cotizacion_detalles where id_cotizacion = p_quote_id
  loop
    v_line_id := public.app_next_id();
    insert into public.orden_compra_detalles
      (id, id_orden, id_variante, cantidad, precio_unitario, subtotal)
    values
      (v_line_id, v_order_id, v_detail.id_variante, v_detail.cantidad, v_detail.precio_unitario, v_detail.subtotal);
  end loop;

  update public.cotizaciones_compra
  set estado = 'Aceptada'
  where id = p_quote_id;

  return jsonb_build_object('id', v_order_id, 'numero', v_numero, 'subtotal', v_subtotal, 'igv', v_igv, 'total', v_total);
end;
$$;

revoke all on function public.create_order_from_quote(bigint, text, date) from public;
grant execute on function public.create_order_from_quote(bigint, text, date) to authenticated;

create or replace function public.create_invoice(
  p_serie text,
  p_numero text,
  p_order_id bigint,
  p_provider_id bigint,
  p_emission date,
  p_due_date date,
  p_amount numeric,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar facturas';
  end if;

  v_invoice_id := public.app_next_id();
  insert into public.facturas_compra
    (id, serie, numero, id_orden_compra, id_proveedor, fecha_emision, fecha_vencimiento, monto, estado)
  values
    (v_invoice_id, p_serie, p_numero, p_order_id, p_provider_id, p_emission, p_due_date, p_amount, p_status);

  return jsonb_build_object('id', v_invoice_id, 'serie', p_serie, 'numero', p_numero, 'monto', p_amount, 'estado', p_status);
end;
$$;

revoke all on function public.create_invoice(text, text, bigint, bigint, date, date, numeric, text) from public;
grant execute on function public.create_invoice(text, text, bigint, bigint, date, date, numeric, text) to authenticated;
