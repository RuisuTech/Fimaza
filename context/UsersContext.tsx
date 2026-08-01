import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Empleado } from '@/types';

interface UsersContextType {
  employees: Empleado[];
  isLoading: boolean;
  addEmployee: (data: Omit<Empleado, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateEmployee: (id: number, updates: Partial<Empleado>) => void;
  toggleEmployeeStatus: (id: number) => void;
  getEmployeeById: (id: number) => Empleado | undefined;
}

const INITIAL_EMPLOYEES: Empleado[] = [
  {
    id: 1, id_cargo: 1, nombres: 'Carlos', apellidos: 'Admin',
    documento_identidad: '12345678', email: 'admin@inventario.com',
    password_hash: 'admin123', estado: true,
  },
  {
    id: 2, id_cargo: 2, nombres: 'Maria', apellidos: 'Vendedor',
    documento_identidad: '87654321', email: 'user@inventario.com',
    password_hash: 'user123', estado: true,
  },
];

const STORAGE_KEY = '@employees';

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Empleado[]>(INITIAL_EMPLOYEES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedEmployees = JSON.parse(stored) as Empleado[];
        const merged = [...INITIAL_EMPLOYEES];
        for (const se of storedEmployees) {
          if (!merged.some(e => e.documento_identidad === se.documento_identidad)) {
            merged.push(se);
          }
        }
        setEmployees(merged);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const save = async (data: Empleado[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addEmployee = async (data: Omit<Empleado, 'id'>): Promise<{ success: boolean; error?: string }> => {
    if (employees.some(e => e.documento_identidad === data.documento_identidad)) {
      return { success: false, error: 'El documento de identidad ya esta registrado' };
    }
    if (data.email && employees.some(e => e.email === data.email)) {
      return { success: false, error: 'El email ya esta registrado' };
    }
    const newEmployee: Empleado = { ...data, id: Date.now() };
    const updated = [...employees, newEmployee];
    setEmployees(updated);
    await save(updated);
    return { success: true };
  };

  const updateEmployee = async (id: number, updates: Partial<Empleado>) => {
    const updated = employees.map(e => (e.id === id ? { ...e, ...updates } : e));
    setEmployees(updated);
    await save(updated);
  };

  const toggleEmployeeStatus = async (id: number) => {
    const updated = employees.map(e => (e.id === id ? { ...e, estado: !e.estado } : e));
    setEmployees(updated);
    await save(updated);
  };

  const getEmployeeById = (id: number) => employees.find(e => e.id === id);

  return (
    <UsersContext.Provider value={{ employees, isLoading, addEmployee, updateEmployee, toggleEmployeeStatus, getEmployeeById }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error('useUsers must be used within UsersProvider');
  return context;
}
