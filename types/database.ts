// ==========================================================
// Tipos basados en la base de datos DB_FIMAZA
// ==========================================================

// --- Tablas Maestras ---

export interface Cargo {
  id: number;
  nombre_cargo: string;
  descripcion?: string;
  estado: boolean;
}

export interface Marca {
  id: number;
  nombre_marca: string;
  estado: boolean;
}

export interface Categoria {
  id: number;
  nombre_categoria: string;
  descripcion?: string;
}

export interface Genero {
  id: number;
  nombre_genero: string;
  estado: boolean;
}

export interface Talla {
  id: number;
  numero_talla: string;
}

export interface Color {
  id: number;
  nombre_color: string;
}

export interface TipoMovimiento {
  id: number;
  nombre_movimiento: string;
  naturaleza: 'Entrada' | 'Salida';
}

export interface Cliente {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres_razon_social: string;
  telefono?: string;
}

// --- Personal y Seguridad ---

export interface Empleado {
  id: number;
  id_cargo: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  email?: string;
  password_hash: string;
  estado: boolean;
  // Resolved
  cargo?: Cargo;
}

// --- Catálogo de Calzado ---

export interface Producto {
  id: number;
  id_marca: number;
  id_categoria: number;
  id_genero: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  // Resolved
  marca?: Marca;
  categoria?: Categoria;
  genero?: Genero;
  variantes?: ProductoVariante[];
}

export interface ProductoVariante {
  id: number;
  id_producto: number;
  id_talla: number;
  id_color: number;
  codigo_barras?: string;
  precio_compra: number;
  precio_venta: number;
  // Resolved
  talla?: Talla;
  color?: Color;
  inventario?: Inventario;
}

// --- Inventario ---

export interface Inventario {
  id: number;
  id_variante: number;
  stock_actual: number;
  stock_minimo: number;
}

export interface HistorialMovimiento {
  id: number;
  id_inventario: number;
  id_tipo_movimiento: number;
  id_empleado: number;
  cantidad: number;
  fecha_movimiento: string;
  observaciones?: string;
  // Resolved
  tipo_movimiento?: TipoMovimiento;
  empleado?: Empleado;
  variante?: ProductoVariante;
  producto?: Producto;
}

// --- Ventas ---

export type MetodoPago = 'efectivo' | 'tarjeta' | 'yape';

export interface VentaCabecera {
  id: number;
  id_cliente?: number;
  id_empleado_vendedor: number;
  fecha_venta: string;
  subtotal: number;
  igv: number;
  total_venta: number;
  metodo_pago: MetodoPago;
  monto_pagado?: number;
  vuelto?: number;
  estado: 'Completada' | 'Anulada';
  comprobante?: string;
  // Resolved
  detalles?: VentaDetalle[];
  cliente?: Cliente;
  empleado?: Empleado;
}

export interface VentaDetalle {
  id: number;
  id_venta: number;
  id_variante: number;
  cantidad: number;
  precio_unitario: number;
  descuento_aplicado: number;
  subtotal: number;
  // Resolved
  variante?: ProductoVariante;
}

// --- Configuración ---

export interface Settings {
  company_name: string;
  address: string;
  phone: string;
  currency: string;
  dark_mode: boolean;
}

// --- Carrito (POS) ---

export interface CartItem {
  variante: ProductoVariante;
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

// --- Auditoría ---

export type TipoAccion =
  | 'LOGIN' | 'LOGOUT'
  | 'STOCK_UPDATE' | 'SALE_COMPLETED'
  | 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_TOGGLED'
  | 'VARIANT_CREATED' | 'VARIANT_DELETED'
  | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_TOGGLED'
  | 'SETTINGS_CHANGED';

export interface AuditoriaSesion {
  id: number;
  id_empleado: number;
  tipo_accion: TipoAccion;
  detalle: string;
  fecha: string;
  // Resolved
  empleado?: Empleado;
}
