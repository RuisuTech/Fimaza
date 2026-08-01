export type Role = 'admin' | 'colaborador';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  employeeId?: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export * from './database';
