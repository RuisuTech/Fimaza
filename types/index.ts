export type Role = 'admin' | 'colaborador';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  employeeId?: number;
}

export * from './database';
