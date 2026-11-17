import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

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

test('clients, suppliers, products and inventory persist in Supabase', async () => {
  test.skip(
    !supabaseUrl || !supabaseAnonKey || !adminEmail || !adminPassword,
    'Supabase or admin E2E credentials are not configured',
  );

  const admin = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = Date.now();
  const clientId = suffix * 1000 + 1;
  const supplierId = suffix * 1000 + 2;
  const productId = suffix * 1000 + 3;
  const variantId = suffix * 1000 + 4;
  const inventoryId = suffix * 1000 + 5;

  try {
    let result = await admin.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    expect(result.error).toBeNull();

    result = await admin.from('clientes').insert({
      id: clientId,
      tipo_documento: 'DNI',
      numero_documento: String(suffix).slice(-8),
      nombres_razon_social: `Cliente E2E ${suffix}`,
      telefono: '999000111',
      correo: `cliente-${suffix}@example.com`,
    });
    expect(result.error).toBeNull();

    result = await admin.from('proveedores').insert({
      id: supplierId,
      ruc: String(suffix).slice(-11).padStart(11, '0'),
      razon_social: `Proveedor E2E ${suffix}`,
      telefono: '999000222',
      direccion: 'Dirección E2E',
      email: `proveedor-${suffix}@example.com`,
    });
    expect(result.error).toBeNull();

    result = await admin.from('productos').insert({
      id: productId,
      id_marca: 1,
      id_categoria: 1,
      id_genero: 1,
      nombre: `Producto E2E ${suffix}`,
      descripcion: 'Producto temporal E2E',
      estado: true,
    });
    expect(result.error).toBeNull();

    result = await admin.from('producto_variantes').insert({
      id: variantId,
      id_producto: productId,
      id_talla: 6,
      id_color: 1,
      codigo_barras: `MOD-${suffix}`,
      precio_compra: 50,
      precio_venta: 100,
    });
    expect(result.error).toBeNull();

    result = await admin.from('inventario').insert({
      id: inventoryId,
      id_variante: variantId,
      stock_actual: 5,
      stock_minimo: 1,
    });
    expect(result.error).toBeNull();

    const client = await admin.from('clientes').select('*').eq('id', clientId).single();
    expect(client.data?.nombres_razon_social).toBe(`Cliente E2E ${suffix}`);

    const supplier = await admin.from('proveedores').select('*').eq('id', supplierId).single();
    expect(supplier.data?.razon_social).toBe(`Proveedor E2E ${suffix}`);

    const product = await admin.from('productos').select('*').eq('id', productId).single();
    expect(product.data?.nombre).toBe(`Producto E2E ${suffix}`);

    const inventory = await admin
      .from('inventario')
      .select('*')
      .eq('id_variante', variantId)
      .single();
    expect(inventory.data?.stock_actual).toBe(5);

    result = await admin
      .from('clientes')
      .update({ nombres_razon_social: `Cliente E2E actualizado ${suffix}` })
      .eq('id', clientId);
    expect(result.error).toBeNull();

    result = await admin
      .from('proveedores')
      .update({ razon_social: `Proveedor E2E actualizado ${suffix}` })
      .eq('id', supplierId);
    expect(result.error).toBeNull();

    result = await admin
      .from('productos')
      .update({ nombre: `Producto E2E actualizado ${suffix}` })
      .eq('id', productId);
    expect(result.error).toBeNull();

    const updatedClient = await admin
      .from('clientes')
      .select('nombres_razon_social')
      .eq('id', clientId)
      .single();
    expect(updatedClient.data?.nombres_razon_social).toBe(
      `Cliente E2E actualizado ${suffix}`,
    );

    const updatedSupplier = await admin
      .from('proveedores')
      .select('razon_social')
      .eq('id', supplierId)
      .single();
    expect(updatedSupplier.data?.razon_social).toBe(`Proveedor E2E actualizado ${suffix}`);

    const updatedProduct = await admin
      .from('productos')
      .select('nombre')
      .eq('id', productId)
      .single();
    expect(updatedProduct.data?.nombre).toBe(`Producto E2E actualizado ${suffix}`);
  } finally {
    await admin.from('inventario').delete().eq('id', inventoryId);
    await admin.from('producto_variantes').delete().eq('id', variantId);
    await admin.from('productos').delete().eq('id', productId);
    await admin.from('clientes').delete().eq('id', clientId);
    await admin.from('proveedores').delete().eq('id', supplierId);
    await admin.auth.signOut();
  }
});
