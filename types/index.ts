export type Role = 'admin' | 'colaborador';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  location: string;
  category: string;
  brand: string;
  size: string;
  color: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  buyer: string;
  userId: string;
  timestamp: string;
}
