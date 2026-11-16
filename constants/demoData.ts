export interface DemoProduct {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  tallas: string[];
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'p1',
    nombre: 'Air Max 90',
    marca: 'Nike',
    precio: 299.9,
    tallas: ['38', '39', '40', '41', '42'],
  },
  {
    id: 'p2',
    nombre: 'Superstar',
    marca: 'Adidas',
    precio: 249.9,
    tallas: ['36', '37', '38', '39', '40'],
  },
  {
    id: 'p3',
    nombre: '574 Classic',
    marca: 'New Balance',
    precio: 279.9,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    id: 'p4',
    nombre: 'RS-X',
    marca: 'Puma',
    precio: 259.9,
    tallas: ['37', '38', '39', '40'],
  },
];

export const DEMO_PROVIDERS = [
  { label: 'Calzado Andino S.A.C.', value: 'p1' },
  { label: 'Importaciones Pacífico E.I.R.L.', value: 'p2' },
  { label: 'Distribuidora Lima Norte S.A.C.', value: 'p3' },
];

export const DEMO_CLIENTS = [
  { id: 'c1', nombre: 'Cliente de ejemplo', dni: '00000000', correo: 'cliente@ejemplo.com' },
  { id: 'c2', nombre: 'María Fernández', dni: '45678912', correo: 'maria@ejemplo.com' },
  { id: 'c3', nombre: 'Comercial San Juan S.A.C.', dni: '20567891234', correo: 'ventas@sanjuan.com' },
];

export const DEMO_SELLERS = [
  { label: 'Usuario Admin', value: 'admin' },
  { label: 'Vendedora 01', value: 'vendedora01' },
];

export const DEMO_REPORT_ROWS = [
  { producto: 'Air Max 90', pares: 8, importe: 2399.2 },
  { producto: 'Superstar', pares: 6, importe: 1499.4 },
  { producto: '574 Classic', pares: 5, importe: 1399.5 },
  { producto: 'RS-X', pares: 4, importe: 1039.6 },
];

export const DEMO_BARS = [
  { label: 'L', value: 62 },
  { label: 'M', value: 84 },
  { label: 'M', value: 48 },
  { label: 'J', value: 96 },
  { label: 'V', value: 72 },
  { label: 'S', value: 58 },
  { label: 'D', value: 34 },
];

export const DEMO_INVENTORY = [
  { producto: 'Air Max 90', talla: '40', inicial: 12, entradas: 8, salidas: 5, final: 15, estado: 'Normal' },
  { producto: 'Superstar', talla: '38', inicial: 6, entradas: 2, salidas: 7, final: 1, estado: 'Stock bajo' },
  { producto: '574 Classic', talla: '42', inicial: 10, entradas: 4, salidas: 3, final: 11, estado: 'Normal' },
  { producto: 'RS-X', talla: '39', inicial: 3, entradas: 0, salidas: 1, final: 2, estado: 'Stock bajo' },
];

export const DEMO_SHORTAGES = [
  { id: 's1', producto: 'Air Max 90', talla: '40', stock: 2, minimo: 8, proveedor: 'p1', reponer: 6 },
  { id: 's2', producto: 'Superstar', talla: '38', stock: 3, minimo: 10, proveedor: 'p2', reponer: 7 },
  { id: 's3', producto: 'RS-X', talla: '39', stock: 1, minimo: 6, proveedor: 'p3', reponer: 5 },
];

export const DEMO_PURCHASE_ORDERS = [
  { id: 'PC-0005', proveedor: 'Calzado Andino S.A.C.', fecha: '12/11/2026', total: 4490.0, estado: 'Atendido' },
  { id: 'PC-0004', proveedor: 'Importaciones Pacífico E.I.R.L.', fecha: '10/11/2026', total: 3120.5, estado: 'Enviado' },
  { id: 'PC-0003', proveedor: 'Distribuidora Lima Norte S.A.C.', fecha: '08/11/2026', total: 2780.0, estado: 'Borrador' },
];

export const DEMO_QUOTES = [
  { id: 'COT-0001', proveedor: 'Calzado Andino S.A.C.', total: 4490.0, valida: '30/11/2026', estado: 'Aceptada' },
  { id: 'COT-0002', proveedor: 'Importaciones Pacífico E.I.R.L.', total: 3120.5, valida: '28/11/2026', estado: 'Pendiente' },
  { id: 'COT-0003', proveedor: 'Distribuidora Lima Norte S.A.C.', total: 1780.0, valida: '25/11/2026', estado: 'Rechazada' },
];

export const DEMO_ORDER_DETAIL = [
  { producto: 'Air Max 90', talla: '40', cantidad: 8, precio: 180.0, subtotal: 1440.0 },
  { producto: 'Superstar', talla: '38', cantidad: 6, precio: 150.0, subtotal: 900.0 },
  { producto: '574 Classic', talla: '42', cantidad: 5, precio: 190.0, subtotal: 950.0 },
];

export const DEMO_ISSUED_ORDERS = [
  { id: 'OC-0003', proveedor: 'Calzado Andino S.A.C.', total: 3290.0, estado: 'Emitida' },
  { id: 'OC-0002', proveedor: 'Importaciones Pacífico E.I.R.L.', total: 2450.0, estado: 'Recibida' },
];

export const DEMO_INVOICES = [
  { factura: 'F001-000045', proveedor: 'Calzado Andino S.A.C.', orden: 'OC-0003', monto: 3290.0, estado: 'Pendiente' },
  { factura: 'F001-000044', proveedor: 'Importaciones Pacífico E.I.R.L.', orden: 'OC-0002', monto: 2450.0, estado: 'Pagada' },
  { factura: 'F001-000043', proveedor: 'Distribuidora Lima Norte S.A.C.', orden: 'OC-0001', monto: 1780.0, estado: 'Vencida' },
];
