import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Sale } from '@/types';

interface SalesContextType {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'timestamp'>) => void;
  totalSales: number;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([]);

  const addSale = (data: Omit<Sale, 'id' | 'timestamp'>) => {
    const newSale: Sale = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setSales(prev => [newSale, ...prev]);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <SalesContext.Provider value={{ sales, addSale, totalSales }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSales must be used within SalesProvider');
  return context;
}
