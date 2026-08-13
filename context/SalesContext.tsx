import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VentaCabecera, VentaDetalle, CartItem, MetodoPago } from '@/types';
import { Settings } from '@/context/SettingsContext';

interface SalesContextType {
  sales: VentaCabecera[];
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  completeSale: (employeeId: number, metodoPago: MetodoPago, montoPagado?: number, settings?: Settings) => { success: boolean; venta?: VentaCabecera; error?: string };
  generateReceipt: (venta: VentaCabecera, settings: Settings) => string;
  calculateIGV: (total: number, igvRate: number) => { subtotal: number; igv: number; total: number };
  getSalesByDateRange: (start: Date, end: Date) => VentaCabecera[];
  getTodaySales: () => VentaCabecera[];
}

const INITIAL_SALES: VentaCabecera[] = [];

const STORAGE_KEY = '@sales';
const CART_KEY = '@cart';

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<VentaCabecera[]>(INITIAL_SALES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CART_KEY),
      ]);
      if (s) {
        const storedSales = JSON.parse(s) as VentaCabecera[];
        const merged = [...INITIAL_SALES];
        for (const ss of storedSales) {
          if (!merged.some(ms => ms.id === ss.id)) {
            merged.push(ss);
          }
        }
        setSales(merged);
      }
      if (c) setCart(JSON.parse(c));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const saveSales = async (data: VentaCabecera[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const saveCart = async (data: CartItem[]) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(data));
  };

  const addToCart = (item: CartItem) => {
    const existing = cart.find(c => c.variante.id === item.variante.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(c =>
        c.variante.id === item.variante.id
          ? { ...c, cantidad: c.cantidad + item.cantidad, subtotal: (c.cantidad + item.cantidad) * c.precio_unitario }
          : c
      );
    } else {
      updated = [...cart, item];
    }
    setCart(updated);
    saveCart(updated);
  };

  const updateCartQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    const updated = cart.map(c =>
      c.variante.id === variantId
        ? { ...c, cantidad: quantity, subtotal: quantity * c.precio_unitario }
        : c
    );
    setCart(updated);
    saveCart(updated);
  };

  const removeFromCart = (variantId: number) => {
    const updated = cart.filter(c => c.variante.id !== variantId);
    setCart(updated);
    saveCart(updated);
  };

  const clearCart = () => {
    setCart([]);
    saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateIGV = (total: number, igvRate: number) => {
    const subtotal = total / (1 + igvRate / 100);
    const igv = total - subtotal;
    return { subtotal, igv, total };
  };

  const generateReceipt = (venta: VentaCabecera, settings: Settings): string => {
    const fecha = new Date(venta.fecha_venta);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const ventaId = venta.id.toString().padStart(5, '0');

    let receipt = '';
    receipt += `${'='.repeat(36)}\n`;
    receipt += `        ${settings.businessName}\n`;
    receipt += `     ${settings.businessAddress}\n`;
    receipt += `       Tel: ${settings.businessPhone}\n`;
    receipt += `${'='.repeat(36)}\n`;
    receipt += ` Comprobante: #${ventaId}\n`;
    receipt += ` Fecha: ${fechaStr} ${horaStr}\n`;
    receipt += `${'-'.repeat(36)}\n`;

    if (venta.detalles) {
      for (const d of venta.detalles) {
        const precioLinea = d.subtotal.toFixed(2);
        receipt += ` ${d.cantidad}x variante #${d.id_variante}\n`;
        receipt += `   S/ ${precioLinea.padStart(10)}\n`;
      }
    }

    receipt += `${'-'.repeat(36)}\n`;
    receipt += ` Subtotal:${' '.repeat(16)}S/ ${venta.subtotal.toFixed(2).padStart(8)}\n`;
    receipt += ` IGV (${settings.igvRate}%):${' '.repeat(14)}S/ ${venta.igv.toFixed(2).padStart(8)}\n`;
    receipt += `${'='.repeat(36)}\n`;
    receipt += ` TOTAL:${' '.repeat(20)}S/ ${venta.total_venta.toFixed(2).padStart(8)}\n`;
    receipt += `${'='.repeat(36)}\n`;

    const metodoLabels: Record<MetodoPago, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      yape: 'Yape',
    };
    receipt += ` Pago: ${metodoLabels[venta.metodo_pago]}\n`;

    if (venta.metodo_pago === 'efectivo' && venta.monto_pagado) {
      receipt += ` Recibido:${' '.repeat(17)}S/ ${venta.monto_pagado.toFixed(2).padStart(8)}\n`;
      receipt += ` Vuelto:${' '.repeat(19)}S/ ${(venta.vuelto || 0).toFixed(2).padStart(8)}\n`;
    }

    if (venta.metodo_pago === 'yape') {
      receipt += `${'-'.repeat(36)}\n`;
      receipt += ` Yape: ${settings.yapeNumber}\n`;
    }

    receipt += `${'='.repeat(36)}\n`;
    receipt += `      ¡Gracias por su compra!\n`;
    receipt += `${'='.repeat(36)}\n`;

    return receipt;
  };

  const completeSale = (employeeId: number, metodoPago: MetodoPago, montoPagado?: number, settings?: Settings): { success: boolean; venta?: VentaCabecera; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'El carrito esta vacio' };
    }

    const cartTotal = getCartTotal();
    const igvRate = settings?.igvRate || 18;
    const { subtotal, igv, total } = calculateIGV(cartTotal, igvRate);

    if (metodoPago === 'efectivo' && montoPagado) {
      if (montoPagado < total) {
        return { success: false, error: 'Monto insuficiente' };
      }
    }

    const detalles: VentaDetalle[] = cart.map((item, index) => ({
      id: Date.now() + index,
      id_venta: 0,
      id_variante: item.variante.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      descuento_aplicado: item.descuento,
      subtotal: item.subtotal,
    }));

    const newSale: VentaCabecera = {
      id: Date.now(),
      id_empleado_vendedor: employeeId,
      fecha_venta: new Date().toISOString(),
      subtotal,
      igv,
      total_venta: total,
      metodo_pago: metodoPago,
      monto_pagado: metodoPago === 'efectivo' ? montoPagado : undefined,
      vuelto: metodoPago === 'efectivo' && montoPagado ? montoPagado - total : undefined,
      estado: 'Completada',
      detalles,
    };

    if (settings) {
      newSale.comprobante = generateReceipt(newSale, settings);
    }

    detalles.forEach(d => { d.id_venta = newSale.id; });

    const updated = [newSale, ...sales];
    setSales(updated);
    saveSales(updated);
    clearCart();

    return { success: true, venta: newSale };
  };

  const getSalesByDateRange = (start: Date, end: Date) => {
    return sales.filter(s => {
      const fecha = new Date(s.fecha_venta);
      return fecha >= start && fecha <= end && s.estado === 'Completada';
    });
  };

  const getTodaySales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getSalesByDateRange(today, tomorrow);
  };

  return (
    <SalesContext.Provider value={{
      sales, cart, isLoading,
      addToCart, updateCartQuantity, removeFromCart, clearCart, getCartTotal,
      completeSale, generateReceipt, calculateIGV, getSalesByDateRange, getTodaySales,
    }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSales must be used within SalesProvider');
  return context;
}
