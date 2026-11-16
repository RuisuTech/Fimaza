import type { ModuleTab } from '@/components/admin/ModuleTabs';

export function gestionTabs(active: 'usuarios' | 'clientes' | 'productos' | 'proveedores'): ModuleTab[] {
  return [
    { label: 'Usuarios', route: '/(admin)/usuarios', active: active === 'usuarios' },
    { label: 'Clientes', route: '/(admin)/clientes', active: active === 'clientes' },
    { label: 'Productos', route: '/(admin)/productos', active: active === 'productos' },
    { label: 'Proveedores', route: '/(admin)/proveedores', active: active === 'proveedores' },
  ];
}

export function comprasTabs(
  active: 'pedidos' | 'cotizaciones' | 'orden' | 'facturas',
): ModuleTab[] {
  return [
    { label: 'Pedidos', route: '/(admin)/compras/pedidos', active: active === 'pedidos' },
    {
      label: 'Cotizaciones',
      route: '/(admin)/compras/cotizaciones',
      active: active === 'cotizaciones',
    },
    { label: 'Orden de compra', route: '/(admin)/compras/orden', active: active === 'orden' },
    { label: 'Facturas', route: '/(admin)/compras/facturas', active: active === 'facturas' },
  ];
}

export function almacenTabs(
  active: 'guia-salida' | 'guia-entrada' | 'inventario' | 'faltantes',
): ModuleTab[] {
  return [
    {
      label: 'Guía de salida',
      route: '/(admin)/almacen/guia-salida',
      active: active === 'guia-salida',
    },
    {
      label: 'Guía de entrada',
      route: '/(admin)/almacen/guia-entrada',
      active: active === 'guia-entrada',
    },
    {
      label: 'Inventario',
      route: '/(admin)/almacen/inventario',
      active: active === 'inventario',
    },
    {
      label: 'Faltantes',
      route: '/(admin)/almacen/faltantes',
      active: active === 'faltantes',
    },
  ];
}
