import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  GuiaEntrada,
  GuiaEntradaDetalle,
  GuiaSalida,
  GuiaSalidaDetalle,
  MovimientoInventario,
} from '@/types';

interface ExitLine {
  variantId: number;
  cantidad: number;
}

interface EntryLine {
  variantId: number;
  cantidadEsperada: number;
  cantidadRecibida: number;
}

interface CreateExitGuideInput {
  numero: string;
  fecha: string;
  motivo: string;
  referencia?: string;
  employeeId: number;
  lines: ExitLine[];
}

interface CreateEntryGuideInput {
  numero: string;
  fecha: string;
  orderId?: number;
  providerId: number;
  observaciones?: string;
  lines: EntryLine[];
}

interface WarehouseResult {
  success: boolean;
  error?: string;
}

interface WarehouseContextType {
  movements: MovimientoInventario[];
  exitGuides: GuiaSalida[];
  exitDetails: GuiaSalidaDetalle[];
  entryGuides: GuiaEntrada[];
  entryDetails: GuiaEntradaDetalle[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createExitGuide: (input: CreateExitGuideInput) => Promise<WarehouseResult>;
  createEntryGuide: (input: CreateEntryGuideInput) => Promise<WarehouseResult>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

function mapMovement(row: any): MovimientoInventario {
  return {
    id: Number(row.id),
    id_variante: Number(row.id_variante),
    tipo: row.tipo,
    cantidad: Number(row.cantidad),
    motivo: row.motivo ?? undefined,
    referencia: row.referencia ?? undefined,
    id_empleado: row.id_empleado ? Number(row.id_empleado) : undefined,
    fecha: row.fecha,
  };
}

function mapExitGuide(row: any): GuiaSalida {
  return {
    id: Number(row.id),
    numero: row.numero,
    fecha: row.fecha,
    motivo: row.motivo,
    referencia: row.referencia ?? undefined,
    id_empleado: Number(row.id_empleado),
    estado: row.estado,
  };
}

function mapExitDetail(row: any): GuiaSalidaDetalle {
  return {
    id: Number(row.id),
    id_guia: Number(row.id_guia),
    id_variante: Number(row.id_variante),
    cantidad: Number(row.cantidad),
  };
}

function mapEntryGuide(row: any): GuiaEntrada {
  return {
    id: Number(row.id),
    numero: row.numero,
    fecha: row.fecha,
    id_orden_compra: row.id_orden_compra ? Number(row.id_orden_compra) : undefined,
    id_proveedor: Number(row.id_proveedor),
    observaciones: row.observaciones ?? undefined,
    estado: row.estado,
  };
}

function mapEntryDetail(row: any): GuiaEntradaDetalle {
  return {
    id: Number(row.id),
    id_guia: Number(row.id_guia),
    id_variante: Number(row.id_variante),
    cantidad_esperada: Number(row.cantidad_esperada),
    cantidad_recibida: Number(row.cantidad_recibida),
  };
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [movements, setMovements] = useState<MovimientoInventario[]>([]);
  const [exitGuides, setExitGuides] = useState<GuiaSalida[]>([]);
  const [exitDetails, setExitDetails] = useState<GuiaSalidaDetalle[]>([]);
  const [entryGuides, setEntryGuides] = useState<GuiaEntrada[]>([]);
  const [entryDetails, setEntryDetails] = useState<GuiaEntradaDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMovements([]);
      setExitGuides([]);
      setExitDetails([]);
      setEntryGuides([]);
      setEntryDetails([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refresh();
  }, [user]);

  const refresh = async () => {
    try {
      const [movementsResult, exitResult, exitDetailResult, entryResult, entryDetailResult] =
        await Promise.all([
          supabase.from('movimientos_inventario').select('*').order('fecha', { ascending: false }),
          supabase.from('guias_salida').select('*').order('fecha', { ascending: false }),
          supabase.from('guia_salida_detalles').select('*'),
          supabase.from('guias_entrada').select('*').order('fecha', { ascending: false }),
          supabase.from('guia_entrada_detalles').select('*'),
        ]);

      if (movementsResult.error) throw movementsResult.error;
      if (exitResult.error) throw exitResult.error;
      if (exitDetailResult.error) throw exitDetailResult.error;
      if (entryResult.error) throw entryResult.error;
      if (entryDetailResult.error) throw entryDetailResult.error;

      setMovements((movementsResult.data ?? []).map(mapMovement));
      setExitGuides((exitResult.data ?? []).map(mapExitGuide));
      setExitDetails((exitDetailResult.data ?? []).map(mapExitDetail));
      setEntryGuides((entryResult.data ?? []).map(mapEntryGuide));
      setEntryDetails((entryDetailResult.data ?? []).map(mapEntryDetail));
    } catch (error) {
      console.error('Error cargando almacén:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createExitGuide = async (input: CreateExitGuideInput): Promise<WarehouseResult> => {
    if (input.lines.length === 0) {
      return { success: false, error: 'Agrega al menos un producto.' };
    }

    const { error } = await supabase.rpc('create_exit_guide', {
      p_numero: input.numero,
      p_fecha: input.fecha,
      p_motivo: input.motivo,
      p_referencia: input.referencia ?? null,
      p_lines: input.lines.map(line => ({
        variant_id: line.variantId,
        cantidad: line.cantidad,
      })),
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const createEntryGuide = async (input: CreateEntryGuideInput): Promise<WarehouseResult> => {
    if (input.lines.length === 0) {
      return { success: false, error: 'No hay mercadería para registrar.' };
    }

    const { error } = await supabase.rpc('create_entry_guide', {
      p_numero: input.numero,
      p_fecha: input.fecha,
      p_order_id: input.orderId ?? null,
      p_provider_id: input.providerId,
      p_observaciones: input.observaciones ?? null,
      p_lines: input.lines.map(line => ({
        variant_id: line.variantId,
        cantidad_esperada: line.cantidadEsperada,
        cantidad_recibida: line.cantidadRecibida,
      })),
    });

    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  return (
    <WarehouseContext.Provider
      value={{
        movements,
        exitGuides,
        exitDetails,
        entryGuides,
        entryDetails,
        isLoading,
        refresh,
        createExitGuide,
        createEntryGuide,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error('useWarehouse must be used within WarehouseProvider');
  return context;
}
