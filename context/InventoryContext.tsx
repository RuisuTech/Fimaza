import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistorialMovimiento } from '@/types';

interface InventoryContextType {
  movements: HistorialMovimiento[];
  isLoading: boolean;
  addMovement: (movement: Omit<HistorialMovimiento, 'id' | 'fecha_movimiento'>) => void;
  getMovementsByVariant: (variantId: number) => HistorialMovimiento[];
  getMovementsByInventory: (inventoryId: number) => HistorialMovimiento[];
}

const INITIAL_MOVEMENTS: HistorialMovimiento[] = [
  { id: 1, id_inventario: 1, id_tipo_movimiento: 1, id_empleado: 1, cantidad: 12, fecha_movimiento: new Date(Date.now() - 86400000 * 5).toISOString(), observaciones: 'Compra inicial' },
  { id: 2, id_inventario: 2, id_tipo_movimiento: 1, id_empleado: 1, cantidad: 8, fecha_movimiento: new Date(Date.now() - 86400000 * 5).toISOString(), observaciones: 'Compra inicial' },
  { id: 3, id_inventario: 3, id_tipo_movimiento: 1, id_empleado: 1, cantidad: 4, fecha_movimiento: new Date(Date.now() - 86400000 * 5).toISOString(), observaciones: 'Compra inicial' },
  { id: 4, id_inventario: 4, id_tipo_movimiento: 1, id_empleado: 1, cantidad: 10, fecha_movimiento: new Date(Date.now() - 86400000 * 4).toISOString(), observaciones: 'Compra inicial' },
  { id: 5, id_inventario: 1, id_tipo_movimiento: 3, id_empleado: 2, cantidad: 3, fecha_movimiento: new Date(Date.now() - 86400000 * 3).toISOString(), observaciones: 'Venta' },
  { id: 6, id_inventario: 6, id_tipo_movimiento: 3, id_empleado: 2, cantidad: 5, fecha_movimiento: new Date(Date.now() - 86400000 * 2).toISOString(), observaciones: 'Venta' },
  { id: 7, id_inventario: 10, id_tipo_movimiento: 3, id_empleado: 2, cantidad: 3, fecha_movimiento: new Date(Date.now() - 86400000 * 1).toISOString(), observaciones: 'Venta' },
  { id: 8, id_inventario: 1, id_tipo_movimiento: 2, id_empleado: 1, cantidad: 2, fecha_movimiento: new Date(Date.now() - 86400000 * 1).toISOString(), observaciones: 'Devolucion cliente' },
];

const STORAGE_KEY = '@inventory_movements';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [movements, setMovements] = useState<HistorialMovimiento[]>(INITIAL_MOVEMENTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedMovements = JSON.parse(stored) as HistorialMovimiento[];
        const merged = [...INITIAL_MOVEMENTS];
        for (const sm of storedMovements) {
          if (!merged.some(m => m.id === sm.id)) {
            merged.push(sm);
          }
        }
        setMovements(merged);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const save = async (data: HistorialMovimiento[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addMovement = (movement: Omit<HistorialMovimiento, 'id' | 'fecha_movimiento'>) => {
    const newMovement: HistorialMovimiento = {
      ...movement,
      id: Date.now(),
      fecha_movimiento: new Date().toISOString(),
    };
    const updated = [...movements, newMovement];
    setMovements(updated);
    save(updated);
  };

  const getMovementsByVariant = (variantId: number) => {
    return movements.filter(m => {
      const inv = movements.find(mi => mi.id === m.id_inventario);
      return inv && inv.id_inventario === m.id_inventario;
    }).sort((a, b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime());
  };

  const getMovementsByInventory = (inventoryId: number) => {
    return movements
      .filter(m => m.id_inventario === inventoryId)
      .sort((a, b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime());
  };

  return (
    <InventoryContext.Provider value={{ movements, isLoading, addMovement, getMovementsByVariant, getMovementsByInventory }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
