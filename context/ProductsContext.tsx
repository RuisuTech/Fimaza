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

const INITIAL_PRODUCTS: Producto[] = [
  { id: 1, id_marca: 1, id_categoria: 1, id_genero: 1, nombre: 'Nike Air Max 90', descripcion: 'Zapatilla clasica de running', estado: true },
  { id: 2, id_marca: 2, id_categoria: 1, id_genero: 1, nombre: 'Adidas Ultraboost', descripcion: 'Zapatilla de alto rendimiento', estado: true },
  { id: 3, id_marca: 3, id_categoria: 2, id_genero: 3, nombre: 'New Balance 574', descripcion: 'Zapatilla casual clasica', estado: true },
  { id: 4, id_marca: 4, id_categoria: 2, id_genero: 1, nombre: 'Puma RS-X', descripcion: 'Zapatilla retro running', estado: true },
  { id: 5, id_marca: 6, id_categoria: 2, id_genero: 3, nombre: 'Converse Chuck Taylor', descripcion: 'Zapatilla clasica de tela', estado: true },
  { id: 6, id_marca: 1, id_categoria: 6, id_genero: 1, nombre: 'Nike Dunk Low', descripcion: 'Zapatilla de skateboarding', estado: true },
  { id: 7, id_marca: 2, id_categoria: 2, id_genero: 3, nombre: 'Adidas Stan Smith', descripcion: 'Zapatilla clasica de cuero', estado: true },
  { id: 8, id_marca: 7, id_categoria: 6, id_genero: 3, nombre: 'Vans Old Skool', descripcion: 'Zapatilla de skate clasica', estado: true },
];

const INITIAL_VARIANTS: ProductoVariante[] = [
  // Nike Air Max 90
  { id: 1, id_producto: 1, id_talla: 6, id_color: 2, codigo_barras: 'NK-AM90-001', precio_compra: 280, precio_venta: 450 },
  { id: 2, id_producto: 1, id_talla: 7, id_color: 2, codigo_barras: 'NK-AM90-002', precio_compra: 280, precio_venta: 450 },
  { id: 3, id_producto: 1, id_talla: 8, id_color: 1, codigo_barras: 'NK-AM90-003', precio_compra: 280, precio_venta: 450 },
  // Adidas Ultraboost
  { id: 4, id_producto: 2, id_talla: 7, id_color: 1, codigo_barras: 'AD-UB-001', precio_compra: 320, precio_venta: 520 },
  { id: 5, id_producto: 2, id_talla: 8, id_color: 1, codigo_barras: 'AD-UB-002', precio_compra: 320, precio_venta: 520 },
  // New Balance 574
  { id: 6, id_producto: 3, id_talla: 7, id_color: 6, codigo_barras: 'NB-574-001', precio_compra: 200, precio_venta: 350 },
  { id: 7, id_producto: 3, id_talla: 8, id_color: 6, codigo_barras: 'NB-574-002', precio_compra: 200, precio_venta: 350 },
  { id: 8, id_producto: 3, id_talla: 9, id_color: 6, codigo_barras: 'NB-574-003', precio_compra: 200, precio_venta: 350 },
  // Puma RS-X
  { id: 9, id_producto: 4, id_talla: 6, id_color: 4, codigo_barras: 'PM-RSX-001', precio_compra: 180, precio_venta: 300 },
  // Converse Chuck Taylor
  { id: 10, id_producto: 5, id_talla: 5, id_color: 1, codigo_barras: 'CV-CT-001', precio_compra: 150, precio_venta: 280 },
  { id: 11, id_producto: 5, id_talla: 6, id_color: 1, codigo_barras: 'CV-CT-002', precio_compra: 150, precio_venta: 280 },
  { id: 12, id_producto: 5, id_talla: 7, id_color: 2, codigo_barras: 'CV-CT-003', precio_compra: 150, precio_venta: 280 },
  // Nike Dunk Low
  { id: 13, id_producto: 6, id_talla: 8, id_color: 5, codigo_barras: 'NK-DL-001', precio_compra: 260, precio_venta: 420 },
  // Adidas Stan Smith
  { id: 14, id_producto: 7, id_talla: 7, id_color: 2, codigo_barras: 'AD-SS-001', precio_compra: 200, precio_venta: 340 },
  { id: 15, id_producto: 7, id_talla: 8, id_color: 2, codigo_barras: 'AD-SS-002', precio_compra: 200, precio_venta: 340 },
  // Vans Old Skool
  { id: 16, id_producto: 8, id_talla: 6, id_color: 1, codigo_barras: 'VN-OS-001', precio_compra: 160, precio_venta: 290 },
  { id: 17, id_producto: 8, id_talla: 7, id_color: 1, codigo_barras: 'VN-OS-002', precio_compra: 160, precio_venta: 290 },
  { id: 18, id_producto: 8, id_talla: 8, id_color: 2, codigo_barras: 'VN-OS-003', precio_compra: 160, precio_venta: 290 },
];

const INITIAL_INVENTORY: Inventario[] = [
  { id: 1, id_variante: 1, stock_actual: 12, stock_minimo: 5 },
  { id: 2, id_variante: 2, stock_actual: 8, stock_minimo: 5 },
  { id: 3, id_variante: 3, stock_actual: 4, stock_minimo: 5 },
  { id: 4, id_variante: 4, stock_actual: 10, stock_minimo: 5 },
  { id: 5, id_variante: 5, stock_actual: 8, stock_minimo: 5 },
  { id: 6, id_variante: 6, stock_actual: 15, stock_minimo: 5 },
  { id: 7, id_variante: 7, stock_actual: 10, stock_minimo: 5 },
  { id: 8, id_variante: 8, stock_actual: 5, stock_minimo: 5 },
  { id: 9, id_variante: 9, stock_actual: 3, stock_minimo: 5 },
  { id: 10, id_variante: 10, stock_actual: 20, stock_minimo: 5 },
  { id: 11, id_variante: 11, stock_actual: 15, stock_minimo: 5 },
  { id: 12, id_variante: 12, stock_actual: 7, stock_minimo: 5 },
  { id: 13, id_variante: 13, stock_actual: 2, stock_minimo: 5 },
  { id: 14, id_variante: 14, stock_actual: 14, stock_minimo: 5 },
  { id: 15, id_variante: 15, stock_actual: 14, stock_minimo: 5 },
  { id: 16, id_variante: 16, stock_actual: 18, stock_minimo: 5 },
  { id: 17, id_variante: 17, stock_actual: 12, stock_minimo: 5 },
  { id: 18, id_variante: 18, stock_actual: 5, stock_minimo: 5 },
];

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
