import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  createUser: (data: { name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  isAdmin: boolean;
}

const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@inventario.com', password: 'admin123', name: 'Carlos Admin', role: 'admin', employeeId: 1 },
  { id: '2', email: 'user@inventario.com', password: 'user123', name: 'Maria Vendedor', role: 'colaborador', employeeId: 2 },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@auth_user';
const USERS_KEY = '@users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadUsers();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      if (stored) {
        const storedUsers = JSON.parse(stored) as User[];
        const merged = [...INITIAL_USERS];
        for (const su of storedUsers) {
          if (!merged.some(u => u.email === su.email)) {
            merged.push(su);
          }
        }
        setUsers(merged);
      }
    } catch {}
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, error: 'Credenciales incorrectas' };
    setUser(found);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return { success: true, user: found };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
    if (user?.id === id) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const createUser = async (data: { name: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    if (users.some(u => u.email === data.email)) {
      return { success: false, error: 'El email ya esta registrado' };
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: 'colaborador',
    };
    const updated = [...users, newUser];
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
    return { success: true };
  };

  const deleteUser = async (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, users, isLoading, login, logout, createUser, updateUser, deleteUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
