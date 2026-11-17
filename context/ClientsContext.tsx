import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { nextId } from '@/lib/ids';
import { useAuth } from '@/context/AuthContext';
import { Cliente } from '@/types';

interface ClientsContextType {
  clients: Cliente[];
  isLoading: boolean;
  addClient: (data: Omit<Cliente, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateClient: (
    id: number,
    updates: Partial<Cliente>,
  ) => Promise<{ success: boolean; error?: string }>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

function mapClient(row: any): Cliente {
  return {
    id: Number(row.id),
    tipo_documento: row.tipo_documento,
    numero_documento: row.numero_documento,
    nombres_razon_social: row.nombres_razon_social,
    telefono: row.telefono ?? undefined,
    correo: row.correo ?? undefined,
  };
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadClients();
  }, [user]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setClients((data ?? []).map(mapClient));
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async (
    data: Omit<Cliente, 'id'>,
  ): Promise<{ success: boolean; error?: string }> => {
    const duplicated = clients.some(
      client =>
        client.tipo_documento === data.tipo_documento &&
        client.numero_documento === data.numero_documento,
    );

    if (duplicated) {
      return { success: false, error: 'El documento ya está registrado' };
    }

    const newClient: Cliente = { ...data, id: nextId() };
    const { error } = await supabase.from('clientes').insert({
      ...newClient,
      telefono: newClient.telefono ?? null,
      correo: newClient.correo ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    setClients(previous => [...previous, newClient]);
    return { success: true };
  };

  const updateClient = async (
    id: number,
    updates: Partial<Cliente>,
  ): Promise<{ success: boolean; error?: string }> => {
    const payload: Record<string, unknown> = { ...updates };
    if ('telefono' in updates) payload.telefono = updates.telefono ?? null;
    if ('correo' in updates) payload.correo = updates.correo ?? null;

    const { error } = await supabase.from('clientes').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };

    setClients(previous =>
      previous.map(client => (client.id === id ? { ...client, ...updates } : client)),
    );
    return { success: true };
  };

  return (
    <ClientsContext.Provider value={{ clients, isLoading, addClient, updateClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) throw new Error('useClients must be used within ClientsProvider');
  return context;
}
