import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Activity {
  id: string;
  userId: string;
  action: string;
  detail: string;
  timestamp: string;
}

interface ActivityContextType {
  activities: Activity[];
  log: (userId: string, action: string, detail: string) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const log = (userId: string, action: string, detail: string) => {
    const entry: Activity = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      userId,
      action,
      detail,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [entry, ...prev]);
  };

  return (
    <ActivityContext.Provider value={{ activities, log }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within ActivityProvider');
  return context;
}
