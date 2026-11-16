import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { nextId } from '@/lib/ids';
import { useAuth } from '@/context/AuthContext';
import { Proveedor } from '@/types';

interface SuppliersContextType {
  suppliers: Proveedor[];
  isLoading: boolean;
  addSupplier: (data: Omit<Proveedor, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateSupplier: (
    id: number,
    updates: Omit<Proveedor, 'id'>,
  ) => Promise<{ success: boolean; error?: string }>;
}

const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

function mapSupplier(row: any): Proveedor {
  return {
    id: Number(row.id),
    ruc: row.ruc,
    razon_social: row.razon_social,
    telefono: row.telefono ?? undefined,
    direccion: row.direccion ?? undefined,
    email: row.email ?? undefined,
  };
}

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadSuppliers();
  }, [user]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setSuppliers((data ?? []).map(mapSupplier));
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSupplier = async (
    data: Omit<Proveedor, 'id'>,
  ): Promise<{ success: boolean; error?: string }> => {
    const ruc = data.ruc.trim();

    if (suppliers.some(supplier => supplier.ruc === ruc)) {
      return { success: false, error: 'El RUC ya está registrado' };
    }

    const newSupplier: Proveedor = {
      ...data,
      id: nextId(),
      ruc,
      razon_social: data.razon_social.trim(),
      telefono: data.telefono?.trim() || undefined,
      direccion: data.direccion?.trim() || undefined,
      email: data.email?.trim() || undefined,
    };

    const { error } = await supabase.from('proveedores').insert({
      ...newSupplier,
      telefono: newSupplier.telefono ?? null,
      direccion: newSupplier.direccion ?? null,
      email: newSupplier.email ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    setSuppliers(previous => [...previous, newSupplier]);
    return { success: true };
  };

  const updateSupplier = async (
    id: number,
    updates: Omit<Proveedor, 'id'>,
  ): Promise<{ success: boolean; error?: string }> => {
    const ruc = updates.ruc.trim();

    if (suppliers.some(supplier => supplier.id !== id && supplier.ruc === ruc)) {
      return { success: false, error: 'El RUC ya está registrado' };
    }

    const nextSupplier: Proveedor = {
      id,
      ruc,
      razon_social: updates.razon_social.trim(),
      telefono: updates.telefono?.trim() || undefined,
      direccion: updates.direccion?.trim() || undefined,
      email: updates.email?.trim() || undefined,
    };

    const { error } = await supabase
      .from('proveedores')
      .update({
        ruc: nextSupplier.ruc,
        razon_social: nextSupplier.razon_social,
        telefono: nextSupplier.telefono ?? null,
        direccion: nextSupplier.direccion ?? null,
        email: nextSupplier.email ?? null,
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    setSuppliers(previous =>
      previous.map(supplier => (supplier.id === id ? nextSupplier : supplier)),
    );
    return { success: true };
  };

  return (
    <SuppliersContext.Provider value={{ suppliers, isLoading, addSupplier, updateSupplier }}>
      {children}
    </SuppliersContext.Provider>
  );
}

export function useSuppliers() {
  const context = useContext(SuppliersContext);
  if (!context) throw new Error('useSuppliers must be used within SuppliersProvider');
  return context;
}
