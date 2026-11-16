import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Venta, VentaDetalle } from '@/types';

interface SaleItem {
  variantId: number;
  cantidad: number;
  precioUnitario: number;
}

interface CreateSaleInput {
  clientId?: number;
  employeeId: number;
  items: SaleItem[];
  metodoPago?: string;
}

interface SaleResult {
  success: boolean;
  error?: string;
  venta?: Venta;
}

interface SalesContextType {
  sales: Venta[];
  saleDetails: VentaDetalle[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createSale: (input: CreateSaleInput) => Promise<SaleResult>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

function mapSale(row: any): Venta {
  return {
    id: Number(row.id),
    id_cliente: row.id_cliente ? Number(row.id_cliente) : undefined,
    id_empleado: Number(row.id_empleado),
    fecha: row.fecha,
    subtotal: Number(row.subtotal),
    igv: Number(row.igv),
    total: Number(row.total),
    metodo_pago: row.metodo_pago,
    estado: row.estado,
    comprobante: row.comprobante ?? undefined,
  };
}

function mapSaleDetail(row: any): VentaDetalle {
  return {
    id: Number(row.id),
    id_venta: Number(row.id_venta),
    id_variante: Number(row.id_variante),
    cantidad: Number(row.cantidad),
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sales, setSales] = useState<Venta[]>([]);
  const [saleDetails, setSaleDetails] = useState<VentaDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSales([]);
      setSaleDetails([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refresh();
  }, [user]);

  const refresh = async () => {
    try {
      const [salesResult, detailsResult] = await Promise.all([
        supabase.from('ventas').select('*').order('fecha', { ascending: false }),
        supabase.from('venta_detalles').select('*'),
      ]);
      if (salesResult.error) throw salesResult.error;
      if (detailsResult.error) throw detailsResult.error;
      setSales((salesResult.data ?? []).map(mapSale));
      setSaleDetails((detailsResult.data ?? []).map(mapSaleDetail));
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setSales([]);
      setSaleDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createSale = async (input: CreateSaleInput): Promise<SaleResult> => {
    if (input.items.length === 0) {
      return { success: false, error: 'El carrito está vacío.' };
    }

    const { data, error } = await supabase.rpc('create_sale', {
      p_client_id: input.clientId ?? null,
      p_items: input.items.map(item => ({
        variant_id: item.variantId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
      p_metodo_pago: input.metodoPago ?? 'efectivo',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await refresh();
    const venta = mapSale(data);
    return { success: true, venta };
  };

  return (
    <SalesContext.Provider value={{ sales, saleDetails, isLoading, refresh, createSale }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSales must be used within SalesProvider');
  return context;
}
