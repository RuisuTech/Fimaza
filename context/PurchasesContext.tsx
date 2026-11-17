import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  CotizacionCompra,
  CotizacionDetalle,
  FacturaCompra,
  OrdenCompra,
  OrdenCompraDetalle,
  PedidoCompra,
  PedidoCompraDetalle,
} from '@/types';

interface PurchaseLine {
  variantId: number;
  cantidad: number;
  precioUnitario: number;
}

interface CreateQuoteInput {
  providerId: number;
  lines: PurchaseLine[];
  validUntil?: string;
}

interface CreatePurchaseOrderInput {
  providerId: number;
  lines: PurchaseLine[];
  requiredDate?: string;
}

interface CreateOrderInput {
  quoteId: number;
  numero?: string;
  fecha?: string;
}

interface CreateInvoiceInput {
  serie: string;
  numero: string;
  orderId?: number;
  providerId: number;
  emission: string;
  dueDate?: string;
  amount: number;
  status: string;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
}

interface PurchasesContextType {
  quotes: CotizacionCompra[];
  quoteDetails: CotizacionDetalle[];
  purchaseOrders: PedidoCompra[];
  purchaseOrderDetails: PedidoCompraDetalle[];
  orders: OrdenCompra[];
  orderDetails: OrdenCompraDetalle[];
  invoices: FacturaCompra[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createQuote: (input: CreateQuoteInput) => Promise<PurchaseResult>;
  createPurchaseOrder: (input: CreatePurchaseOrderInput) => Promise<PurchaseResult>;
  createOrderFromQuote: (input: CreateOrderInput) => Promise<PurchaseResult>;
  createInvoice: (input: CreateInvoiceInput) => Promise<PurchaseResult>;
  updatePurchaseOrderStatus: (id: number, status: string) => Promise<PurchaseResult>;
  updateQuoteStatus: (id: number, status: string) => Promise<PurchaseResult>;
  updateInvoiceStatus: (id: number, status: string) => Promise<PurchaseResult>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

function mapQuote(row: any): CotizacionCompra {
  return {
    id: Number(row.id),
    numero: row.numero,
    id_proveedor: Number(row.id_proveedor),
    fecha: row.fecha,
    valida_hasta: row.valida_hasta ?? undefined,
    total: Number(row.total),
    estado: row.estado,
  };
}

function mapQuoteDetail(row: any): CotizacionDetalle {
  return {
    id: Number(row.id),
    id_cotizacion: Number(row.id_cotizacion),
    id_variante: Number(row.id_variante),
    cantidad: Number(row.cantidad),
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

function mapPurchaseOrder(row: any): PedidoCompra {
  return {
    id: Number(row.id),
    numero: row.numero,
    id_proveedor: Number(row.id_proveedor),
    fecha: row.fecha,
    fecha_requerida: row.fecha_requerida ?? undefined,
    total: Number(row.total),
    estado: row.estado,
  };
}

function mapPurchaseDetail(row: any): PedidoCompraDetalle {
  return {
    id: Number(row.id),
    id_pedido: Number(row.id_pedido),
    id_variante: Number(row.id_variante),
    cantidad: Number(row.cantidad),
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

function mapOrder(row: any): OrdenCompra {
  return {
    id: Number(row.id),
    numero: row.numero,
    id_cotizacion: row.id_cotizacion ? Number(row.id_cotizacion) : undefined,
    id_proveedor: Number(row.id_proveedor),
    fecha: row.fecha,
    subtotal: Number(row.subtotal),
    igv: Number(row.igv),
    total: Number(row.total),
    estado: row.estado,
  };
}

function mapOrderDetail(row: any): OrdenCompraDetalle {
  return {
    id: Number(row.id),
    id_orden: Number(row.id_orden),
    id_variante: Number(row.id_variante),
    cantidad: Number(row.cantidad),
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

function mapInvoice(row: any): FacturaCompra {
  return {
    id: Number(row.id),
    serie: row.serie,
    numero: row.numero,
    id_orden_compra: row.id_orden_compra ? Number(row.id_orden_compra) : undefined,
    id_proveedor: Number(row.id_proveedor),
    fecha_emision: row.fecha_emision,
    fecha_vencimiento: row.fecha_vencimiento ?? undefined,
    monto: Number(row.monto),
    estado: row.estado,
  };
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<CotizacionCompra[]>([]);
  const [quoteDetails, setQuoteDetails] = useState<CotizacionDetalle[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PedidoCompra[]>([]);
  const [purchaseOrderDetails, setPurchaseOrderDetails] = useState<PedidoCompraDetalle[]>([]);
  const [orders, setOrders] = useState<OrdenCompra[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrdenCompraDetalle[]>([]);
  const [invoices, setInvoices] = useState<FacturaCompra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setQuotes([]);
      setQuoteDetails([]);
      setPurchaseOrders([]);
      setPurchaseOrderDetails([]);
      setOrders([]);
      setOrderDetails([]);
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refresh();
  }, [user]);

  const refresh = async () => {
    try {
      const [
        quotesResult,
        quoteDetailsResult,
        purchaseResult,
        purchaseDetailsResult,
        ordersResult,
        orderDetailsResult,
        invoicesResult,
      ] = await Promise.all([
        supabase.from('cotizaciones_compra').select('*').order('id', { ascending: false }),
        supabase.from('cotizacion_detalles').select('*'),
        supabase.from('pedidos_compra').select('*').order('id', { ascending: false }),
        supabase.from('pedido_compra_detalles').select('*'),
        supabase.from('ordenes_compra').select('*').order('id', { ascending: false }),
        supabase.from('orden_compra_detalles').select('*'),
        supabase.from('facturas_compra').select('*').order('id', { ascending: false }),
      ]);

      if (quotesResult.error) throw quotesResult.error;
      if (quoteDetailsResult.error) throw quoteDetailsResult.error;
      if (purchaseResult.error) throw purchaseResult.error;
      if (purchaseDetailsResult.error) throw purchaseDetailsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (orderDetailsResult.error) throw orderDetailsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      setQuotes((quotesResult.data ?? []).map(mapQuote));
      setQuoteDetails((quoteDetailsResult.data ?? []).map(mapQuoteDetail));
      setPurchaseOrders((purchaseResult.data ?? []).map(mapPurchaseOrder));
      setPurchaseOrderDetails((purchaseDetailsResult.data ?? []).map(mapPurchaseDetail));
      setOrders((ordersResult.data ?? []).map(mapOrder));
      setOrderDetails((orderDetailsResult.data ?? []).map(mapOrderDetail));
      setInvoices((invoicesResult.data ?? []).map(mapInvoice));
    } catch (error) {
      console.error('Error cargando compras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createQuote = async (input: CreateQuoteInput): Promise<PurchaseResult> => {
    if (input.lines.length === 0) {
      return { success: false, error: 'Agrega al menos una línea.' };
    }

    const { error } = await supabase.rpc('create_quote', {
      p_provider_id: input.providerId,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_valid_until: input.validUntil ?? null,
      p_lines: input.lines.map(line => ({
        variant_id: line.variantId,
        cantidad: line.cantidad,
        precio_unitario: line.precioUnitario,
      })),
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const createPurchaseOrder = async (
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseResult> => {
    if (input.lines.length === 0) {
      return { success: false, error: 'Agrega al menos una línea.' };
    }

    const { error } = await supabase.rpc('create_purchase_order', {
      p_provider_id: input.providerId,
      p_fecha: new Date().toISOString().slice(0, 10),
      p_required_date: input.requiredDate ?? null,
      p_lines: input.lines.map(line => ({
        variant_id: line.variantId,
        cantidad: line.cantidad,
        precio_unitario: line.precioUnitario,
      })),
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const createOrderFromQuote = async (input: CreateOrderInput): Promise<PurchaseResult> => {
    const { error } = await supabase.rpc('create_order_from_quote', {
      p_quote_id: input.quoteId,
      p_numero: input.numero ?? null,
      p_fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const createInvoice = async (input: CreateInvoiceInput): Promise<PurchaseResult> => {
    const { error } = await supabase.rpc('create_invoice', {
      p_serie: input.serie,
      p_numero: input.numero,
      p_order_id: input.orderId ?? null,
      p_provider_id: input.providerId,
      p_emission: input.emission,
      p_due_date: input.dueDate ?? null,
      p_amount: input.amount,
      p_status: input.status,
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const updatePurchaseOrderStatus = async (
    id: number,
    status: string,
  ): Promise<PurchaseResult> => {
    const { error } = await supabase.from('pedidos_compra').update({ estado: status }).eq('id', id);
    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const updateQuoteStatus = async (id: number, status: string): Promise<PurchaseResult> => {
    const { error } = await supabase
      .from('cotizaciones_compra')
      .update({ estado: status })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const updateInvoiceStatus = async (id: number, status: string): Promise<PurchaseResult> => {
    const { error } = await supabase
      .from('facturas_compra')
      .update({ estado: status })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  return (
    <PurchasesContext.Provider
      value={{
        quotes,
        quoteDetails,
        purchaseOrders,
        purchaseOrderDetails,
        orders,
        orderDetails,
        invoices,
        isLoading,
        refresh,
        createQuote,
        createPurchaseOrder,
        createOrderFromQuote,
        createInvoice,
        updatePurchaseOrderStatus,
        updateQuoteStatus,
        updateInvoiceStatus,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error('usePurchases must be used within PurchasesProvider');
  return context;
}
