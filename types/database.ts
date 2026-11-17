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

export interface Cliente {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres_razon_social: string;
  telefono?: string;
  correo?: string;
}

export interface Proveedor {
  id: number;
  ruc: string;
  razon_social: string;
  telefono?: string;
  direccion?: string;
  email?: string;
}

// --- Personal y Seguridad ---

export interface Empleado {
  id: number;
  id_cargo: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  usuario?: string;
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

// --- Ventas ---

export interface Venta {
  id: number;
  id_cliente?: number;
  id_empleado: number;
  fecha: string;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;
  estado: string;
  comprobante?: string;
  detalles?: VentaDetalle[];
}

export interface VentaDetalle {
  id: number;
  id_venta: number;
  id_variante: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// --- Movimientos de inventario ---

export interface MovimientoInventario {
  id: number;
  id_variante: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo?: string;
  referencia?: string;
  id_empleado?: number;
  fecha: string;
}

// --- Guías de almacén ---

export interface GuiaSalida {
  id: number;
  numero: string;
  fecha: string;
  motivo: string;
  referencia?: string;
  id_empleado: number;
  estado: string;
  detalles?: GuiaSalidaDetalle[];
}

export interface GuiaSalidaDetalle {
  id: number;
  id_guia: number;
  id_variante: number;
  cantidad: number;
}

export interface GuiaEntrada {
  id: number;
  numero: string;
  fecha: string;
  id_orden_compra?: number;
  id_proveedor: number;
  observaciones?: string;
  estado: string;
  detalles?: GuiaEntradaDetalle[];
}

export interface GuiaEntradaDetalle {
  id: number;
  id_guia: number;
  id_variante: number;
  cantidad_esperada: number;
  cantidad_recibida: number;
}

// --- Compras ---

export interface PedidoCompra {
  id: number;
  numero: string;
  id_proveedor: number;
  fecha: string;
  fecha_requerida?: string;
  total: number;
  estado: string;
  detalles?: PedidoCompraDetalle[];
}

export interface PedidoCompraDetalle {
  id: number;
  id_pedido: number;
  id_variante: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CotizacionCompra {
  id: number;
  numero: string;
  id_proveedor: number;
  fecha: string;
  valida_hasta?: string;
  total: number;
  estado: string;
  detalles?: CotizacionDetalle[];
}

export interface CotizacionDetalle {
  id: number;
  id_cotizacion: number;
  id_variante: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface OrdenCompra {
  id: number;
  numero: string;
  id_cotizacion?: number;
  id_proveedor: number;
  fecha: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: string;
  detalles?: OrdenCompraDetalle[];
}

export interface OrdenCompraDetalle {
  id: number;
  id_orden: number;
  id_variante: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface FacturaCompra {
  id: number;
  serie: string;
  numero: string;
  id_orden_compra?: number;
  id_proveedor: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  monto: number;
  estado: string;
}

// --- Auditoría ---

export type TipoAccion =
  | 'LOGIN' | 'LOGOUT'
  | 'STOCK_UPDATE' | 'SALE_COMPLETED'
  | 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_TOGGLED'
  | 'VARIANT_CREATED' | 'VARIANT_DELETED'
  | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_TOGGLED' | 'EMPLOYEE_DELETED'
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
