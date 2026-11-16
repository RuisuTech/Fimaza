import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { nextId } from '@/lib/ids';
import { useAuth } from '@/context/AuthContext';
import { Producto, ProductoVariante, Inventario } from '@/types';

interface ProductsContextType {
  products: Producto[];
  variants: ProductoVariante[];
  inventory: Inventario[];
  isLoading: boolean;
  addProduct: (product: Omit<Producto, 'id'>) => Promise<Producto>;
  updateProduct: (id: number, updates: Partial<Producto>) => Promise<void>;
  toggleProductStatus: (id: number) => Promise<void>;
  addVariant: (
    variant: Omit<ProductoVariante, 'id'>,
    stockInicial?: number,
    stockMinimo?: number,
  ) => Promise<ProductoVariante>;
  updateVariant: (id: number, updates: Partial<ProductoVariante>) => Promise<void>;
  deleteVariant: (id: number) => Promise<void>;
  getVariantsByProduct: (productId: number) => ProductoVariante[];
  getInventoryByVariant: (variantId: number) => Inventario | undefined;
  decreaseStock: (variantId: number, qty: number) => Promise<boolean>;
  increaseStock: (variantId: number, qty: number) => Promise<void>;
  setVariantInventory: (
    variantId: number,
    stockActual: number,
    stockMinimo: number,
  ) => Promise<void>;
  getProductWithVariants: (productId: number) => Producto | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

function mapProduct(row: any): Producto {
  return {
    id: Number(row.id),
    id_marca: Number(row.id_marca),
    id_categoria: Number(row.id_categoria),
    id_genero: Number(row.id_genero),
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    estado: Boolean(row.estado),
  };
}

function mapVariant(row: any): ProductoVariante {
  return {
    id: Number(row.id),
    id_producto: Number(row.id_producto),
    id_talla: Number(row.id_talla),
    id_color: Number(row.id_color),
    codigo_barras: row.codigo_barras ?? undefined,
    precio_compra: Number(row.precio_compra ?? 0),
    precio_venta: Number(row.precio_venta ?? 0),
  };
}

function mapInventory(row: any): Inventario {
  return {
    id: Number(row.id),
    id_variante: Number(row.id_variante),
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo),
  };
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Producto[]>([]);
  const [variants, setVariants] = useState<ProductoVariante[]>([]);
  const [inventory, setInventory] = useState<Inventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setVariants([]);
      setInventory([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [productsResult, variantsResult, inventoryResult] = await Promise.all([
        supabase.from('productos').select('*').order('id'),
        supabase.from('producto_variantes').select('*').order('id'),
        supabase.from('inventario').select('*').order('id'),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (variantsResult.error) throw variantsResult.error;
      if (inventoryResult.error) throw inventoryResult.error;

      setProducts((productsResult.data ?? []).map(mapProduct));
      setVariants((variantsResult.data ?? []).map(mapVariant));
      setInventory((inventoryResult.data ?? []).map(mapInventory));
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
      setVariants([]);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (product: Omit<Producto, 'id'>): Promise<Producto> => {
    const newProduct: Producto = { ...product, id: nextId() };
    const { error } = await supabase.from('productos').insert({
      ...newProduct,
      descripcion: newProduct.descripcion ?? null,
    });
    if (error) throw error;
    setProducts(previous => [...previous, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: number, updates: Partial<Producto>) => {
    const { error } = await supabase.from('productos').update(updates).eq('id', id);
    if (error) throw error;
    setProducts(previous =>
      previous.map(product => (product.id === id ? { ...product, ...updates } : product)),
    );
  };

  const toggleProductStatus = async (id: number) => {
    const product = products.find(item => item.id === id);
    if (!product) throw new Error('Producto no encontrado');

    const { error } = await supabase
      .from('productos')
      .update({ estado: !product.estado })
      .eq('id', id);
    if (error) throw error;

    setProducts(previous =>
      previous.map(item => (item.id === id ? { ...item, estado: !item.estado } : item)),
    );
  };

  const addVariant = async (
    variant: Omit<ProductoVariante, 'id'>,
    stockInicial: number = 0,
    stockMinimo: number = 5,
  ): Promise<ProductoVariante> => {
    const newVariant: ProductoVariante = { ...variant, id: nextId() };
    const { error: variantError } = await supabase.from('producto_variantes').insert({
      ...newVariant,
      codigo_barras: newVariant.codigo_barras ?? null,
    });

    if (variantError) throw variantError;

    const newInventory: Inventario = {
      id: nextId(),
      id_variante: newVariant.id,
      stock_actual: stockInicial,
      stock_minimo: stockMinimo,
    };

    const { error: inventoryError } = await supabase.from('inventario').insert(newInventory);

    if (inventoryError) {
      await supabase.from('producto_variantes').delete().eq('id', newVariant.id);
      throw inventoryError;
    }

    setVariants(previous => [...previous, newVariant]);
    setInventory(previous => [...previous, newInventory]);
    return newVariant;
  };

  const updateVariant = async (id: number, updates: Partial<ProductoVariante>) => {
    const payload: Record<string, unknown> = { ...updates };
    if ('codigo_barras' in updates) payload.codigo_barras = updates.codigo_barras ?? null;

    const { error } = await supabase
      .from('producto_variantes')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    setVariants(previous =>
      previous.map(variant => (variant.id === id ? { ...variant, ...updates } : variant)),
    );
  };

  const deleteVariant = async (id: number) => {
    const { error } = await supabase.from('producto_variantes').delete().eq('id', id);
    if (error) throw error;
    setVariants(previous => previous.filter(variant => variant.id !== id));
    setInventory(previous => previous.filter(item => item.id_variante !== id));
  };

  const getVariantsByProduct = (productId: number) =>
    variants.filter(variant => variant.id_producto === productId);

  const getInventoryByVariant = (variantId: number) =>
    inventory.find(item => item.id_variante === variantId);

  const decreaseStock = async (variantId: number, qty: number): Promise<boolean> => {
    const current = inventory.find(item => item.id_variante === variantId);
    if (!current || current.stock_actual < qty) return false;

    const nextStock = current.stock_actual - qty;
    const { error } = await supabase
      .from('inventario')
      .update({ stock_actual: nextStock })
      .eq('id', current.id);

    if (error) throw error;
    setInventory(previous =>
      previous.map(item =>
        item.id === current.id ? { ...item, stock_actual: nextStock } : item,
      ),
    );
    return true;
  };

  const increaseStock = async (variantId: number, qty: number) => {
    const current = inventory.find(item => item.id_variante === variantId);
    if (!current) throw new Error('Inventario no encontrado');

    const nextStock = current.stock_actual + qty;
    const { error } = await supabase
      .from('inventario')
      .update({ stock_actual: nextStock })
      .eq('id', current.id);

    if (error) throw error;
    setInventory(previous =>
      previous.map(item =>
        item.id === current.id ? { ...item, stock_actual: nextStock } : item,
      ),
    );
  };

  const setVariantInventory = async (
    variantId: number,
    stockActual: number,
    stockMinimo: number,
  ) => {
    const existing = inventory.find(item => item.id_variante === variantId);

    if (existing) {
      const { error } = await supabase
        .from('inventario')
        .update({ stock_actual: stockActual, stock_minimo: stockMinimo })
        .eq('id', existing.id);

      if (error) throw error;
      setInventory(previous =>
        previous.map(item =>
          item.id === existing.id
            ? { ...item, stock_actual: stockActual, stock_minimo: stockMinimo }
            : item,
        ),
      );
      return;
    }

    const newInventory: Inventario = {
      id: nextId(),
      id_variante: variantId,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
    };
    const { error } = await supabase.from('inventario').insert(newInventory);
    if (error) throw error;
    setInventory(previous => [...previous, newInventory]);
  };

  const getProductWithVariants = (productId: number) => {
    const product = products.find(item => item.id === productId);
    if (!product) return undefined;
    return { ...product, variantes: variants.filter(item => item.id_producto === productId) };
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        variants,
        inventory,
        isLoading,
        addProduct,
        updateProduct,
        toggleProductStatus,
        addVariant,
        updateVariant,
        deleteVariant,
        getVariantsByProduct,
        getInventoryByVariant,
        decreaseStock,
        increaseStock,
        setVariantInventory,
        getProductWithVariants,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within ProductsProvider');
  return context;
}
