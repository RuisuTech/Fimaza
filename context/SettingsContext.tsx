import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  systemName: string;
  isDarkMode: boolean;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  igvRate: number;
  yapeNumber: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const SETTINGS_KEY = '@fimaza_settings';

const DEFAULT_SETTINGS: Settings = {
  systemName: 'Fimaza Multiplataforma',
  isDarkMode: false,
  businessName: 'FIMAZA',
  businessAddress: 'Av. Principal 123',
  businessPhone: '999 888 777',
  igvRate: 18,
  yapeNumber: '999 888 777',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, loaded]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
