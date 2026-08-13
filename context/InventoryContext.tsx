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

const INITIAL_MOVEMENTS: HistorialMovimiento[] = [];

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
