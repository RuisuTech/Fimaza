import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuditoriaSesion, TipoAccion } from '@/types';

interface ActivityContextType {
  activities: AuditoriaSesion[];
  isLoading: boolean;
  log: (employeeId: number, tipo: TipoAccion, detalle: string) => void;
  getActivitiesByEmployee: (employeeId: number) => AuditoriaSesion[];
  getRecentActivities: (limit?: number) => AuditoriaSesion[];
}

const STORAGE_KEY = '@audit_log';
const MAX_ACTIVITIES = 500;

const INITIAL_ACTIVITIES: AuditoriaSesion[] = [];

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<AuditoriaSesion[]>(INITIAL_ACTIVITIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuditoriaSesion[];
        setActivities(parsed);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const saveActivities = async (data: AuditoriaSesion[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };

  const log = (employeeId: number, tipo: TipoAccion, detalle: string) => {
    const entry: AuditoriaSesion = {
      id: Date.now(),
      id_empleado: employeeId,
      tipo_accion: tipo,
      detalle,
      fecha: new Date().toISOString(),
    };
    const updated = [entry, ...activities].slice(0, MAX_ACTIVITIES);
    setActivities(updated);
    saveActivities(updated);
  };

  const getActivitiesByEmployee = (employeeId: number) => {
    return activities
      .filter(a => a.id_empleado === employeeId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const getRecentActivities = (limit: number = 20) => {
    return activities
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limit);
  };

  return (
    <ActivityContext.Provider value={{
      activities, isLoading,
      log, getActivitiesByEmployee, getRecentActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within ActivityProvider');
  return context;
}
