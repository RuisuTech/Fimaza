import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Empleado } from '@/types';

interface MutationResult {
  success: boolean;
  error?: string;
}

interface CreateEmployeeInput {
  id_cargo: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  usuario: string;
  email?: string;
  password: string;
  estado: boolean;
}

interface UsersContextType {
  employees: Empleado[];
  isLoading: boolean;
  addEmployee: (data: CreateEmployeeInput) => Promise<MutationResult>;
  updateEmployee: (
    id: number,
    updates: Partial<Empleado>,
    password?: string,
  ) => Promise<MutationResult>;
  toggleEmployeeStatus: (id: number) => Promise<MutationResult>;
  getEmployeeById: (id: number) => Empleado | undefined;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

async function getFunctionMessage(error: unknown, fallback: string): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {}
  }
  return error instanceof Error ? error.message : fallback;
}

function mapEmployee(row: any): Empleado {
  return {
    id: Number(row.id),
    id_cargo: Number(row.id_cargo),
    nombres: row.nombres,
    apellidos: row.apellidos,
    documento_identidad: row.documento_identidad,
    usuario: row.usuario ?? undefined,
    email: row.email ?? undefined,
    password_hash: '',
    estado: Boolean(row.estado),
  };
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, id_cargo, nombres, apellidos, documento_identidad, usuario, email, estado')
        .order('id', { ascending: true });
      if (error) throw error;
      setEmployees((data ?? []).map(mapEmployee));
    } catch (error) {
      console.error('Error cargando empleados:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addEmployee = async (data: CreateEmployeeInput): Promise<MutationResult> => {
    if (employees.some(employee => employee.documento_identidad === data.documento_identidad)) {
      return { success: false, error: 'El documento de identidad ya está registrado' };
    }

    const normalized = data.usuario.trim().toLowerCase();
    const duplicated = employees.some(
      employee =>
        (employee.usuario ?? employee.email?.split('@')[0] ?? '').toLowerCase() === normalized,
    );
    if (duplicated) {
      return { success: false, error: 'El usuario ya está registrado' };
    }

    if (data.email && employees.some(employee => employee.email === data.email)) {
      return { success: false, error: 'El email ya está registrado' };
    }

    const { data: response, error: functionError } = await supabase.functions.invoke(
      'admin-create-employee',
      {
        body: {
          id_cargo: data.id_cargo,
          nombres: data.nombres,
          apellidos: data.apellidos,
          documento_identidad: data.documento_identidad,
          usuario: normalized,
          email: data.email,
          password: data.password,
          estado: data.estado,
        },
      },
    );

    if (functionError) {
      return {
        success: false,
        error: await getFunctionMessage(functionError, 'No se pudo crear el usuario'),
      };
    }

    const employee = (response as { employee?: any } | null)?.employee;
    if (!employee) {
      return { success: false, error: 'La función no devolvió el usuario creado' };
    }

    const newEmployee: Empleado = {
      id: Number(employee.id),
      id_cargo: Number(employee.id_cargo),
      nombres: employee.nombres,
      apellidos: employee.apellidos,
      documento_identidad: employee.documento_identidad ?? data.documento_identidad,
      usuario: employee.usuario ?? data.usuario,
      email: employee.email ?? data.email,
      password_hash: '',
      estado: Boolean(employee.estado),
    };

    setEmployees(previous => [...previous, newEmployee]);
    return { success: true };
  };

  const updateEmployee = async (
    id: number,
    updates: Partial<Empleado>,
    password?: string,
  ): Promise<MutationResult> => {
    const current = employees.find(employee => employee.id === id);
    const payload: Record<string, unknown> = { employee_id: id };

    const fields: (keyof Empleado)[] = [
      'id_cargo',
      'nombres',
      'apellidos',
      'documento_identidad',
      'usuario',
      'email',
      'estado',
    ];

    for (const field of fields) {
      if (field in updates) payload[field] = updates[field] ?? null;
    }

    if (password) payload.password = password;

    if (
      updates.email &&
      current &&
      updates.email.trim().toLowerCase() !== (current.email ?? '').toLowerCase()
    ) {
      payload.email = updates.email.trim().toLowerCase();
    }

    const { error: functionError } = await supabase.functions.invoke(
      'admin-update-employee',
      { body: payload },
    );

    if (functionError) {
      return {
        success: false,
        error: await getFunctionMessage(functionError, 'No se pudo actualizar el usuario'),
      };
    }

    setEmployees(previous =>
      previous.map(employee => (employee.id === id ? { ...employee, ...updates } : employee)),
    );
    return { success: true };
  };

  const toggleEmployeeStatus = async (id: number): Promise<MutationResult> => {
    const employee = employees.find(item => item.id === id);
    if (!employee) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const nextStatus = !employee.estado;
    const { error } = await supabase
      .from('empleados')
      .update({ estado: nextStatus })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    setEmployees(previous =>
      previous.map(item => (item.id === id ? { ...item, estado: nextStatus } : item)),
    );
    return { success: true };
  };

  const getEmployeeById = (id: number) => employees.find(employee => employee.id === id);

  return (
    <UsersContext.Provider
      value={{ employees, isLoading, addEmployee, updateEmployee, toggleEmployeeStatus, getEmployeeById }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error('useUsers must be used within UsersProvider');
  return context;
}
