import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Producto, ProductoVariante, Inventario } from '@/types';

interface ProductsContextType {
  products: Producto[];
  variants: ProductoVariante[];
  inventory: Inventario[];
  isLoading: boolean;
  addProduct: (product: Omit<Producto, 'id'>) => Producto;
  updateProduct: (id: number, updates: Partial<Producto>) => void;
  toggleProductStatus: (id: number) => void;
  addVariant: (variant: Omit<ProductoVariante, 'id'>, stockInicial?: number, stockMinimo?: number) => ProductoVariante;
  updateVariant: (id: number, updates: Partial<ProductoVariante>) => void;
  deleteVariant: (id: number) => void;
  getVariantsByProduct: (productId: number) => ProductoVariante[];
  getInventoryByVariant: (variantId: number) => Inventario | undefined;
  decreaseStock: (variantId: number, qty: number) => boolean;
  increaseStock: (variantId: number, qty: number) => void;
  getProductWithVariants: (productId: number) => Producto | undefined;
}

const INITIAL_PRODUCTS: Producto[] = [];

const INITIAL_VARIANTS: ProductoVariante[] = [];

const INITIAL_INVENTORY: Inventario[] = [];

const KEYS = {
  products: '@db_products',
  variants: '@db_variants',
  inventory: '@db_inventory',
};

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Producto[]>(INITIAL_PRODUCTS);
  const [variants, setVariants] = useState<ProductoVariante[]>(INITIAL_VARIANTS);
  const [inventory, setInventory] = useState<Inventario[]>(INITIAL_INVENTORY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, v, i] = await Promise.all([
        AsyncStorage.getItem(KEYS.products),
        AsyncStorage.getItem(KEYS.variants),
        AsyncStorage.getItem(KEYS.inventory),
      ]);
      if (p) setProducts(JSON.parse(p));
      if (v) setVariants(JSON.parse(v));
      if (i) setInventory(JSON.parse(i));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const save = async (key: string, data: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  // --- Products ---
  const addProduct = (product: Omit<Producto, 'id'>): Producto => {
    const newProduct: Producto = { ...product, id: Date.now() };
    const updated = [...products, newProduct];
    setProducts(updated);
    save(KEYS.products, updated);
    return newProduct;
  };

  const updateProduct = (id: number, updates: Partial<Producto>) => {
    const updated = products.map(p => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    save(KEYS.products, updated);
  };

  const toggleProductStatus = (id: number) => {
    const updated = products.map(p => (p.id === id ? { ...p, estado: !p.estado } : p));
    setProducts(updated);
    save(KEYS.products, updated);
  };

  // --- Variants ---
  const addVariant = (variant: Omit<ProductoVariante, 'id'>, stockInicial: number = 0, stockMinimo: number = 5): ProductoVariante => {
    const newVariant: ProductoVariante = { ...variant, id: Date.now() };
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    save(KEYS.variants, updatedVariants);

    const newInventory: Inventario = { id: Date.now() + 1, id_variante: newVariant.id, stock_actual: stockInicial, stock_minimo: stockMinimo };
    const updatedInventory = [...inventory, newInventory];
    setInventory(updatedInventory);
    save(KEYS.inventory, updatedInventory);

    return newVariant;
  };

  const updateVariant = (id: number, updates: Partial<ProductoVariante>) => {
    const updated = variants.map(v => (v.id === id ? { ...v, ...updates } : v));
    setVariants(updated);
    save(KEYS.variants, updated);
  };

  const deleteVariant = (id: number) => {
    const updatedVariants = variants.filter(v => v.id !== id);
    setVariants(updatedVariants);
    save(KEYS.variants, updatedVariants);

    const updatedInventory = inventory.filter(i => i.id_variante !== id);
    setInventory(updatedInventory);
    save(KEYS.inventory, updatedInventory);
  };

  const getVariantsByProduct = (productId: number) => variants.filter(v => v.id_producto === productId);

  const getInventoryByVariant = (variantId: number) => inventory.find(i => i.id_variante === variantId);

  const decreaseStock = (variantId: number, qty: number): boolean => {
    const inv = inventory.find(i => i.id_variante === variantId);
    if (!inv || inv.stock_actual < qty) return false;
    const updated = inventory.map(i => (i.id_variante === variantId ? { ...i, stock_actual: i.stock_actual - qty } : i));
    setInventory(updated);
    save(KEYS.inventory, updated);
    return true;
  };

  const increaseStock = (variantId: number, qty: number) => {
    const updated = inventory.map(i => (i.id_variante === variantId ? { ...i, stock_actual: i.stock_actual + qty } : i));
    setInventory(updated);
    save(KEYS.inventory, updated);
  };

  const getProductWithVariants = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return undefined;
    return { ...product, variantes: variants.filter(v => v.id_producto === productId) };
  };

  return (
    <ProductsContext.Provider value={{
      products, variants, inventory, isLoading,
      addProduct, updateProduct, toggleProductStatus,
      addVariant, updateVariant, deleteVariant,
      getVariantsByProduct, getInventoryByVariant,
      decreaseStock, increaseStock, getProductWithVariants,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within ProductsProvider');
  return context;
}
