import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types';

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  decreaseStock: (id: string, qty: number) => boolean;
}

const STORAGE_KEY = '@products';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Nike Air Max 90', sku: 'NK-AM90-001', quantity: 24, minStock: 8, location: 'Tienda Principal', category: 'Running', brand: 'Nike', size: '42', color: 'Blanco' },
  { id: '2', name: 'Adidas Ultraboost', sku: 'AD-UB-001', quantity: 18, minStock: 6, location: 'Tienda Principal', category: 'Running', brand: 'Adidas', size: '41', color: 'Negro' },
  { id: '3', name: 'New Balance 574', sku: 'NB-574-001', quantity: 30, minStock: 10, location: 'Almacen Central', category: 'Casual', brand: 'New Balance', size: '43', color: 'Gris' },
  { id: '4', name: 'Puma RS-X', sku: 'PM-RSX-001', quantity: 5, minStock: 8, location: 'Tienda Principal', category: 'Casual', brand: 'Puma', size: '40', color: 'Azul' },
  { id: '5', name: 'Converse Chuck Taylor', sku: 'CV-CT-001', quantity: 42, minStock: 12, location: 'Almacen Central', category: 'Casual', brand: 'Converse', size: '39', color: 'Negro' },
  { id: '6', name: 'Nike Dunk Low', sku: 'NK-DL-001', quantity: 3, minStock: 6, location: 'Tienda Principal', category: 'Lifestyle', brand: 'Nike', size: '42', color: 'Verde' },
  { id: '7', name: 'Adidas Stan Smith', sku: 'AD-SS-001', quantity: 28, minStock: 8, location: 'Almacen Central', category: 'Casual', brand: 'Adidas', size: '41', color: 'Blanco' },
  { id: '8', name: 'Vans Old Skool', sku: 'VN-OS-001', quantity: 35, minStock: 10, location: 'Tienda Principal', category: 'Skate', brand: 'Vans', size: '40', color: 'Negro' },
];

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const save = async (items: Product[]) => {
    setProducts(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    save([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    save(products.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    save(products.filter(p => p.id !== id));
  };

  const decreaseStock = (id: string, qty: number): boolean => {
    const product = products.find(p => p.id === id);
    if (!product || product.quantity < qty) return false;
    save(products.map(p => (p.id === id ? { ...p, quantity: p.quantity - qty } : p)));
    return true;
  };

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, decreaseStock }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within ProductsProvider');
  return context;
}
