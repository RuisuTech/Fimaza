import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function loadLocalEnv() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const collaboratorEmail = process.env.E2E_COLLAB_EMAIL;
const collaboratorPassword = process.env.E2E_COLLAB_PASSWORD;

test('critical transactional flows persist and keep stock consistent', async () => {
  test.skip(
    !supabaseUrl || !supabaseAnonKey || !adminEmail || !adminPassword,
    'Supabase or admin E2E credentials are not configured',
  );

  const admin = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const collaborator = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = Date.now();
  const productId = suffix * 1000 + 1;
  const variantId = suffix * 1000 + 2;
  const inventoryId = suffix * 1000 + 3;
  const created: Record<string, number | undefined> = {};

  try {
    let result = await admin.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    expect(result.error).toBeNull();

    result = await admin.from('productos').insert({
      id: productId,
      id_marca: 1,
      id_categoria: 1,
      id_genero: 1,
      nombre: `E2E Product ${suffix}`,
      descripcion: 'Producto temporal E2E',
      estado: true,
    });
    expect(result.error).toBeNull();

    result = await admin.from('producto_variantes').insert({
      id: variantId,
      id_producto: productId,
      id_talla: 6,
      id_color: 1,
      codigo_barras: `E2E-${suffix}`,
      precio_compra: 50,
      precio_venta: 100,
    });
    expect(result.error).toBeNull();

    result = await admin.from('inventario').insert({
      id: inventoryId,
      id_variante: variantId,
      stock_actual: 10,
      stock_minimo: 2,
    });
    expect(result.error).toBeNull();

    const sale = await admin.rpc('create_sale', {
      p_client_id: 1,
      p_items: [{ variant_id: variantId, cantidad: 2, precio_unitario: 100 }],
      p_metodo_pago: 'efectivo',
    });
    expect(sale.error).toBeNull();
    created.sale = Number(sale.data.id);
    expect(sale.data.total).toBe(236);

    let inventory = await admin
      .from('inventario')
      .select('stock_actual')
      .eq('id_variante', variantId)
      .single();
    expect(inventory.data?.stock_actual).toBe(8);

    const overStock = await admin.rpc('create_sale', {
      p_client_id: 1,
      p_items: [{ variant_id: variantId, cantidad: 999, precio_unitario: 100 }],
      p_metodo_pago: 'efectivo',
    });
    expect(overStock.error).not.toBeNull();

    const exitGuide = await admin.rpc('create_exit_guide', {
      p_numero: `E2E-GS-${suffix}`,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_motivo: 'Prueba E2E',
      p_referencia: 'test',
      p_lines: [{ variant_id: variantId, cantidad: 1 }],
    });
    expect(exitGuide.error).toBeNull();
    created.exitGuide = Number(exitGuide.data.id);

    inventory = await admin
      .from('inventario')
      .select('stock_actual')
      .eq('id_variante', variantId)
      .single();
    expect(inventory.data?.stock_actual).toBe(7);

    const entryGuide = await admin.rpc('create_entry_guide', {
      p_numero: `E2E-GE-${suffix}`,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_order_id: null,
      p_provider_id: 1,
      p_observaciones: 'Prueba E2E',
      p_lines: [
        {
          variant_id: variantId,
          cantidad_esperada: 3,
          cantidad_recibida: 3,
        },
      ],
    });
    expect(entryGuide.error).toBeNull();
    created.entryGuide = Number(entryGuide.data.id);

    inventory = await admin
      .from('inventario')
      .select('stock_actual')
      .eq('id_variante', variantId)
      .single();
    expect(inventory.data?.stock_actual).toBe(10);

    const quote = await admin.rpc('create_quote', {
      p_provider_id: 1,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_valid_until: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      p_lines: [{ variant_id: variantId, cantidad: 2, precio_unitario: 100 }],
    });
    expect(quote.error).toBeNull();
    created.quote = Number(quote.data.id);

    const order = await admin.rpc('create_order_from_quote', {
      p_quote_id: quote.data.id,
      p_numero: null,
      p_fecha: new Date().toISOString().slice(0, 10),
    });
    expect(order.error).toBeNull();
    created.order = Number(order.data.id);
    expect(order.data.total).toBe(236);

    const statusEntryGuide = await admin.rpc('create_entry_guide', {
      p_numero: `E2E-GE-ORDER-${suffix}`,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_order_id: order.data.id,
      p_provider_id: 1,
      p_observaciones: 'Prueba de estado',
      p_lines: [
        {
          variant_id: variantId,
          cantidad_esperada: 1,
          cantidad_recibida: 0,
        },
      ],
    });
    expect(statusEntryGuide.error).toBeNull();
    created.statusEntryGuide = Number(statusEntryGuide.data.id);

    let orderState = await admin
      .from('ordenes_compra')
      .select('estado')
      .eq('id', order.data.id)
      .single();
    expect(orderState.data?.estado).toBe('Recibida');

    const invoice = await admin.rpc('create_invoice', {
      p_serie: 'E2E',
      p_numero: String(suffix).slice(-8),
      p_order_id: order.data.id,
      p_provider_id: 1,
      p_emission: new Date().toISOString().slice(0, 10),
      p_due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      p_amount: 236,
      p_status: 'Pendiente',
    });
    expect(invoice.error).toBeNull();
    created.invoice = Number(invoice.data.id);

    const paidInvoice = await admin
      .from('facturas_compra')
      .update({ estado: 'Pagada' })
      .eq('id', invoice.data.id);
    expect(paidInvoice.error).toBeNull();

    orderState = await admin
      .from('ordenes_compra')
      .select('estado')
      .eq('id', order.data.id)
      .single();
    expect(orderState.data?.estado).toBe('Pagada');

    const purchase = await admin.rpc('create_purchase_order', {
      p_provider_id: 1,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_required_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      p_lines: [{ variant_id: variantId, cantidad: 1, precio_unitario: 50 }],
    });
    expect(purchase.error).toBeNull();
    created.purchase = Number(purchase.data.id);

    let purchaseState = await admin
      .from('pedidos_compra')
      .update({ estado: 'Enviado' })
      .eq('id', purchase.data.id);
    expect(purchaseState.error).toBeNull();
    purchaseState = await admin
      .from('pedidos_compra')
      .update({ estado: 'Atendido' })
      .eq('id', purchase.data.id);
    expect(purchaseState.error).toBeNull();

    const rejectedQuote = await admin.rpc('create_quote', {
      p_provider_id: 1,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_valid_until: null,
      p_lines: [{ variant_id: variantId, cantidad: 1, precio_unitario: 50 }],
    });
    expect(rejectedQuote.error).toBeNull();
    created.rejectedQuote = Number(rejectedQuote.data.id);

    const rejected = await admin
      .from('cotizaciones_compra')
      .update({ estado: 'Rechazada' })
      .eq('id', rejectedQuote.data.id);
    expect(rejected.error).toBeNull();

    if (collaboratorEmail && collaboratorPassword) {
      result = await collaborator.auth.signInWithPassword({
        email: collaboratorEmail,
        password: collaboratorPassword,
      });
      expect(result.error).toBeNull();
      const forbidden = await collaborator.rpc('create_quote', {
        p_provider_id: 1,
        p_fecha: new Date().toISOString().slice(0, 10),
        p_valid_until: null,
        p_lines: [{ variant_id: variantId, cantidad: 1, precio_unitario: 10 }],
      });
      expect(forbidden.error).not.toBeNull();
      await collaborator.auth.signOut();
    }

    const movements = await admin
      .from('movimientos_inventario')
      .select('id', { count: 'exact', head: true })
      .eq('id_variante', variantId);
    expect(movements.count).toBeGreaterThanOrEqual(3);

    const audits = await admin
      .from('auditoria_sesion')
      .select('id', { count: 'exact', head: true })
      .ilike('detalle', `%${suffix}%`);
    expect(audits.count).toBeGreaterThan(0);
  } finally {
    await admin.from('auditoria_sesion').delete().ilike('detalle', `%${suffix}%`);
    await cleanup(admin, created, productId, variantId, inventoryId);
    await admin.auth.signOut();
  }
});

async function cleanup(
  admin: SupabaseClient,
  created: Record<string, number | undefined>,
  productId: number,
  variantId: number,
  inventoryId: number,
) {
  if (created.invoice) await admin.from('facturas_compra').delete().eq('id', created.invoice);
  if (created.order) await admin.from('ordenes_compra').delete().eq('id', created.order);
  if (created.quote) await admin.from('cotizaciones_compra').delete().eq('id', created.quote);
  if (created.rejectedQuote)
    await admin.from('cotizaciones_compra').delete().eq('id', created.rejectedQuote);
  if (created.purchase) await admin.from('pedidos_compra').delete().eq('id', created.purchase);
  if (created.exitGuide) await admin.from('guias_salida').delete().eq('id', created.exitGuide);
  if (created.entryGuide) await admin.from('guias_entrada').delete().eq('id', created.entryGuide);
  if (created.statusEntryGuide)
    await admin.from('guias_entrada').delete().eq('id', created.statusEntryGuide);
  if (created.sale) await admin.from('ventas').delete().eq('id', created.sale);
  await admin.from('movimientos_inventario').delete().eq('id_variante', variantId);
  await admin.from('inventario').delete().eq('id', inventoryId);
  await admin.from('producto_variantes').delete().eq('id', variantId);
  await admin.from('productos').delete().eq('id', productId);
}
