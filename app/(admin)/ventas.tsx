import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import { useInventory } from '@/context/InventoryContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useActivity } from '@/context/ActivityContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { Producto, ProductoVariante, MetodoPago, VentaCabecera } from '@/types';

type TabMode = 'pos' | 'history';
type MobileView = 'products' | 'cart';

export default function VentasScreen() {
  const { products, variants, inventory, decreaseStock } = useProducts();
  const { cart, addToCart, updateCartQuantity, removeFromCart, clearCart, getCartTotal, completeSale, sales } = useSales();
  const { marcas, tallas, colores } = useCatalogs();
  const { addMovement } = useInventory();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { log } = useActivity();
  const C = useThemeColors();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  const [tabMode, setTabMode] = useState<TabMode>('pos');
  const [mobileView, setMobileView] = useState<MobileView>('products');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [completedVenta, setCompletedVenta] = useState<VentaCabecera | null>(null);
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const getMarcaName = useCallback((id: number) => marcas.find(m => m.id === id)?.nombre_marca || '', [marcas]);
  const getTallaName = useCallback((id: number) => tallas.find(t => t.id === id)?.numero_talla || '', [tallas]);
  const getColorName = useCallback((id: number) => colores.find(c => c.id === id)?.nombre_color || '', [colores]);

  const availableProducts = useMemo(() => {
    return products.filter(p => {
      const pVariants = variants.filter(v => v.id_producto === p.id);
      return p.estado && pVariants.some(v => {
        const inv = inventory.find(i => i.id_variante === v.id);
        return inv && inv.stock_actual > 0;
      });
    });
  }, [products, variants, inventory]);

  const filteredProducts = useMemo(() => {
    if (!search) return availableProducts;
    const s = search.toLowerCase();
    return availableProducts.filter(p =>
      p.nombre.toLowerCase().includes(s) ||
      getMarcaName(p.id_marca).toLowerCase().includes(s) ||
      variants.some(v => v.id_producto === p.id && v.codigo_barras?.toLowerCase().includes(s))
    );
  }, [availableProducts, search, getMarcaName, variants]);

  const cartTotal = getCartTotal();
  const cartProfit = useMemo(() => {
    return cart.reduce((sum, item) => {
      const pc = item.variante.precio_compra || 0;
      const pv = item.variante.precio_venta || 0;
      return sum + ((pv - pc) * item.cantidad);
    }, 0);
  }, [cart]);

  const openVariants = (product: Producto) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setVariantModalVisible(true);
  };

  const handleAddToCart = (variant: ProductoVariante, product: Producto) => {
    const inv = inventory.find(i => i.id_variante === variant.id);
    const availableStock = inv?.stock_actual || 0;
    const inCart = cart.find(c => c.variante.id === variant.id);
    const currentQty = inCart?.cantidad || 0;

    if (currentQty >= availableStock) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Stock insuficiente' });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart({
      variante: variant,
      producto: product,
      cantidad: 1,
      precio_unitario: variant.precio_venta,
      descuento: 0,
      subtotal: variant.precio_venta,
    });
    setVariantModalVisible(false);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'El carrito esta vacio' });
      return;
    }
    if (!user) return;
    setPaymentModalVisible(true);
  };

  const handlePaymentSelect = (metodo: MetodoPago, montoPagado?: number) => {
    if (!user) return;
    setPaymentModalVisible(false);

    const employeeId = user.employeeId || parseInt(user.id);
    const result = completeSale(employeeId, metodo, montoPagado, settings);

    if (result.success && result.venta) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cart.forEach(item => {
        decreaseStock(item.variante.id, item.cantidad);
        const inv = inventory.find(i => i.id_variante === item.variante.id);
        if (inv) {
          addMovement({ id_inventario: inv.id, id_tipo_movimiento: 3, id_empleado: employeeId, cantidad: item.cantidad });
        }
      });
      setCompletedVenta(result.venta);
      setReceiptModalVisible(true);
      log(employeeId!, 'SALE_COMPLETED', `Venta #${result.venta.id} - S/ ${result.venta.total_venta.toFixed(2)} (${metodo})`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: result.error || 'Error al registrar venta' });
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderProduct = ({ item }: { item: Producto }) => {
    const pVariants = variants.filter(v => v.id_producto === item.id);
    const availableVariants = pVariants.filter(v => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return inv && inv.stock_actual > 0;
    });
    const totalStock = availableVariants.reduce((sum, v) => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return sum + (inv?.stock_actual || 0);
    }, 0);

    return (
      <TouchableOpacity style={[styles.productCard, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => openVariants(item)} activeOpacity={0.7}>
        <View style={[styles.productIcon, { backgroundColor: C.accentLight }]}>
          <Ionicons name="cube" size={18} color={C.accent} />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: C.text }]} numberOfLines={1}>{item.nombre}</Text>
          <Text style={[styles.productMeta, { color: C.textMuted }]}>
            {getMarcaName(item.id_marca)} · {availableVariants.length} variantes
          </Text>
        </View>
        <View style={styles.productStock}>
          <Text style={[styles.productStockValue, { color: C.text }]}>{totalStock}</Text>
          <Text style={[styles.productStockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>{t('sales.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{sales.length} {t('dashboard.registers')}</Text>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, { backgroundColor: tabMode === 'pos' ? C.accent : C.surface, borderColor: tabMode === 'pos' ? C.accent : C.border }]} onPress={() => setTabMode('pos')}>
            <Ionicons name="cart" size={16} color={tabMode === 'pos' ? '#fff' : C.text} />
            <Text style={[styles.tabText, { color: tabMode === 'pos' ? '#fff' : C.text }]}>POS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, { backgroundColor: tabMode === 'history' ? C.accent : C.surface, borderColor: tabMode === 'history' ? C.accent : C.border }]} onPress={() => setTabMode('history')}>
            <Ionicons name="time" size={16} color={tabMode === 'history' ? '#fff' : C.text} />
            <Text style={[styles.tabText, { color: tabMode === 'history' ? '#fff' : C.text }]}>{t('inventory.history')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tabMode === 'pos' ? (
        isMobile ? (
          <View style={{ minHeight: height - 180 }}>
            <View style={[styles.mobileTabRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <TouchableOpacity
                style={[styles.mobileTab, { backgroundColor: mobileView === 'products' ? C.accent : 'transparent', borderBottomColor: mobileView === 'products' ? C.accent : 'transparent' }]}
                onPress={() => setMobileView('products')}
              >
                <Ionicons name="cube" size={16} color={mobileView === 'products' ? '#fff' : C.text} />
                <Text style={[styles.mobileTabText, { color: mobileView === 'products' ? '#fff' : C.text }]}>{t('products.title')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mobileTab, { backgroundColor: mobileView === 'cart' ? C.accent : 'transparent', borderBottomColor: mobileView === 'cart' ? C.accent : 'transparent' }]}
                onPress={() => setMobileView('cart')}
              >
                <Ionicons name="cart" size={16} color={mobileView === 'cart' ? '#fff' : C.text} />
                <Text style={[styles.mobileTabText, { color: mobileView === 'cart' ? '#fff' : C.text }]}>Carrito</Text>
                {cart.length > 0 && (
                  <View style={[styles.cartBadge, { backgroundColor: C.danger }]}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {mobileView === 'products' ? (
              <View style={styles.mobileContent}>
                <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: searchFocused ? C.accent : C.border }]}>
                  <Ionicons name="search" size={18} color={C.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
                    placeholder={t('products.search')}
                    placeholderTextColor={C.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    underlineColorAndroid="transparent"
                    selectionColor={C.accent}
                  />
                </View>
                <FlatList
                  data={filteredProducts}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.productList}
                  showsVerticalScrollIndicator={false}
                  renderItem={renderProduct}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="cart-outline" size={40} color={C.textMuted} />
                      <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
                    </View>
                  }
                />
              </View>
            ) : (
              <View style={[styles.mobileCartContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
                {cart.length === 0 ? (
                  <View style={styles.emptyCart}>
                    <Ionicons name="cart-outline" size={32} color={C.textMuted} />
                    <Text style={[styles.emptyCartText, { color: C.textMuted }]}>{t('sales.emptyHint')}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.cartHeader}>
                      <Text style={[styles.cartTitle, { color: C.text }]}>Carrito ({cart.length})</Text>
                      <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        clearCart();
                      }}>
                        <Text style={[styles.clearText, { color: C.danger }]}>Limpiar</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
                      {cart.map(item => {
                        const inv = inventory.find(i => i.id_variante === item.variante.id);
                        const maxStock = inv?.stock_actual || 0;
                        return (
                          <View key={item.variante.id} style={[styles.cartItem, { borderBottomColor: C.border }]}>
                            <View style={styles.cartItemInfo}>
                              <Text style={[styles.cartItemName, { color: C.text }]} numberOfLines={1}>{item.producto.nombre}</Text>
                              <Text style={[styles.cartItemVariant, { color: C.textMuted }]}>
                                {getTallaName(item.variante.id_talla)} · {getColorName(item.variante.id_color)}
                              </Text>
                              <Text style={[styles.cartItemPrice, { color: C.accent }]}>S/ {item.precio_unitario.toFixed(2)}</Text>
                            </View>
                            <View style={styles.cartItemActions}>
                              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: C.background }]} onPress={() => {
                                Haptics.selectionAsync();
                                updateCartQuantity(item.variante.id, item.cantidad - 1);
                              }}>
                                <Ionicons name="remove" size={16} color={C.text} />
                              </TouchableOpacity>
                              <Text style={[styles.qtyText, { color: C.text }]}>{item.cantidad}</Text>
                              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: C.background }]} onPress={() => {
                                if (item.cantidad < maxStock) {
                                  Haptics.selectionAsync();
                                  updateCartQuantity(item.variante.id, item.cantidad + 1);
                                }
                              }}>
                                <Ionicons name="add" size={16} color={C.text} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.removeBtn} onPress={() => {
                                Haptics.selectionAsync();
                                removeFromCart(item.variante.id);
                              }}>
                                <Ionicons name="close-circle" size={20} color={C.danger} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                    <View style={[styles.cartFooter, { borderTopColor: C.border }]}>
                      <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: C.text }]}>{t('sales.total')}</Text>
                        <Text style={[styles.totalValue, { color: C.accent }]}>S/ {cartTotal.toFixed(2)}</Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: C.success, fontSize: FontSize.md }]}>Ganancia</Text>
                        <Text style={[styles.totalValue, { color: C.success, fontSize: FontSize.lg }]}>S/ {cartProfit.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.saleBtn, { backgroundColor: cart.length > 0 ? C.success : C.textMuted }]}
                        onPress={handleCompleteSale}
                        disabled={cart.length === 0}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.saleBtnText}>{t('sales.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.posContainer}>
            <View style={styles.productPanel}>
              <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: searchFocused ? C.accent : C.border }]}>
                <Ionicons name="search" size={18} color={C.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
                  placeholder={t('products.search')}
                  placeholderTextColor={C.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  underlineColorAndroid="transparent"
                  selectionColor={C.accent}
                />
              </View>
              <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
                <FlatList
                  data={filteredProducts}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.productList}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle={C.textMuted}
                  renderItem={renderProduct}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="cart-outline" size={40} color={C.textMuted} />
                      <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
                    </View>
                  }
                />
              </View>
            </View>

            <View style={[styles.cartPanel, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={styles.cartHeader}>
                <Text style={[styles.cartTitle, { color: C.text }]}>Carrito</Text>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    clearCart();
                  }}>
                    <Text style={[styles.clearText, { color: C.danger }]}>Limpiar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
                {cart.length === 0 ? (
                  <View style={styles.emptyCart}>
                    <Ionicons name="cart-outline" size={32} color={C.textMuted} />
                    <Text style={[styles.emptyCartText, { color: C.textMuted }]}>{t('sales.emptyHint')}</Text>
                  </View>
                ) : (
                  cart.map(item => {
                    const inv = inventory.find(i => i.id_variante === item.variante.id);
                    const maxStock = inv?.stock_actual || 0;
                    return (
                      <View key={item.variante.id} style={[styles.cartItem, { borderBottomColor: C.border }]}>
                        <View style={styles.cartItemInfo}>
                          <Text style={[styles.cartItemName, { color: C.text }]} numberOfLines={1}>{item.producto.nombre}</Text>
                          <Text style={[styles.cartItemVariant, { color: C.textMuted }]}>
                            {getTallaName(item.variante.id_talla)} · {getColorName(item.variante.id_color)}
                          </Text>
                          <Text style={[styles.cartItemPrice, { color: C.accent }]}>S/ {item.precio_unitario.toFixed(2)}</Text>
                        </View>
                        <View style={styles.cartItemActions}>
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: C.background }]} onPress={() => {
                            Haptics.selectionAsync();
                            updateCartQuantity(item.variante.id, item.cantidad - 1);
                          }}>
                            <Ionicons name="remove" size={16} color={C.text} />
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: C.text }]}>{item.cantidad}</Text>
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: C.background }]} onPress={() => {
                            if (item.cantidad < maxStock) {
                              Haptics.selectionAsync();
                              updateCartQuantity(item.variante.id, item.cantidad + 1);
                            }
                          }}>
                            <Ionicons name="add" size={16} color={C.text} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeBtn} onPress={() => {
                            Haptics.selectionAsync();
                            removeFromCart(item.variante.id);
                          }}>
                            <Ionicons name="close-circle" size={20} color={C.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={[styles.cartFooter, { borderTopColor: C.border }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: C.text }]}>{t('sales.total')}</Text>
                  <Text style={[styles.totalValue, { color: C.accent }]}>S/ {cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: C.success, fontSize: FontSize.md }]}>Ganancia</Text>
                  <Text style={[styles.totalValue, { color: C.success, fontSize: FontSize.lg }]}>S/ {cartProfit.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.saleBtn, { backgroundColor: cart.length > 0 ? C.success : C.textMuted }]}
                  onPress={handleCompleteSale}
                  disabled={cart.length === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saleBtnText}>{t('sales.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )
      ) : (
        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={sales.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.historyList}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={({ item }) => {
              const saleProfit = (item.detalles || []).reduce((sum, d) => {
                const v = variants.find(va => va.id === d.id_variante);
                const pc = v?.precio_compra || 0;
                return sum + ((d.precio_unitario - pc) * d.cantidad);
              }, 0);
              return (
              <View style={[styles.historyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.historyHeader}>
                  <View style={[styles.historyIcon, { backgroundColor: C.successLight }]}>
                    <Ionicons name="cart" size={16} color={C.success} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyDate, { color: C.text }]}>{formatDate(item.fecha_venta)}</Text>
                    <Text style={[styles.historyMeta, { color: C.textMuted }]}>
                      {item.detalles?.length || 0} productos
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.historyTotal, { color: C.success }]}>S/ {item.total_venta.toFixed(2)}</Text>
                    <Text style={[styles.historyMeta, { color: saleProfit >= 0 ? C.success : C.danger }]}>
                      +S/ {saleProfit.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {item.detalles?.map(d => {
                  const v = variants.find(va => va.id === d.id_variante);
                  const profit = (d.precio_unitario - (v?.precio_compra || 0)) * d.cantidad;
                  return (
                  <Text key={d.id} style={[styles.historyDetail, { color: C.textMuted }]}>
                    {d.cantidad}x variante #{d.id_variante} - S/ {d.subtotal.toFixed(2)} ({profit >= 0 ? '+' : ''}S/ {profit.toFixed(2)})
                  </Text>
                  );
                })}
              </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('sales.empty')}</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Variant Selection Modal */}
      <Modal visible={variantModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{selectedProduct?.nombre}</Text>
              <TouchableOpacity onPress={() => setVariantModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: C.textMuted }]}>Selecciona variante</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProduct && variants
                .filter(v => v.id_producto === selectedProduct.id)
                .map(v => {
                  const inv = inventory.find(i => i.id_variante === v.id);
                  const stock = inv?.stock_actual || 0;
                  const inCart = cart.find(c => c.variante.id === v.id);
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.variantOption, { backgroundColor: C.background, borderColor: stock > 0 ? C.border : C.danger }]}
                      onPress={() => stock > 0 && handleAddToCart(v, selectedProduct)}
                      disabled={stock <= 0}
                      activeOpacity={0.7}
                    >
                      <View style={styles.variantOptionInfo}>
                        <Text style={[styles.variantOptionName, { color: stock > 0 ? C.text : C.textMuted }]}>
                          Talla {getTallaName(v.id_talla)} · {getColorName(v.id_color)}
                        </Text>
                        <Text style={[styles.variantOptionPrice, { color: C.accent }]}>S/ {v.precio_venta.toFixed(2)}</Text>
                      </View>
                      <View style={styles.variantOptionStock}>
                        <Text style={[styles.variantStockText, { color: stock > 0 ? C.success : C.danger }]}>
                          {stock > 0 ? `${stock} disp.` : 'Sin stock'}
                        </Text>
                        {inCart && (
                          <Text style={[styles.inCartText, { color: C.accent }]}>En carrito: {inCart.cantidad}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PaymentModal
        visible={paymentModalVisible}
        total={cartTotal}
        onSelect={handlePaymentSelect}
        onCancel={() => setPaymentModalVisible(false)}
      />

      <ReceiptModal
        visible={receiptModalVisible}
        venta={completedVenta}
        settings={settings}
        onClose={() => {
          setReceiptModalVisible(false);
          setCompletedVenta(null);
        }}
      />

      <AlertModal
        visible={alertState.visible} type={alertState.type} title={alertState.title}
        message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  tabRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  tabText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  posContainer: { flex: 1, flexDirection: 'row', paddingHorizontal: Spacing.xl },
  productPanel: { flex: 1, marginRight: Spacing.lg },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.lg, marginLeft: Spacing.md },
  listContainer: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  productList: { paddingBottom: 100 },
  productCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1,
  },
  productIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  productMeta: { fontSize: FontSize.sm, marginTop: 4 },
  productStock: { alignItems: 'flex-end' },
  productStockValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  productStockLabel: { fontSize: FontSize.sm },
  cartPanel: {
    width: 360, borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.xl,
  },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  cartTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  clearText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  cartItems: { flex: 1 },
  emptyCart: { alignItems: 'center', paddingVertical: 40 },
  emptyCartText: { fontSize: FontSize.md, marginTop: Spacing.md },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1 },
  cartItemInfo: { flex: 1, marginRight: Spacing.md },
  cartItemName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cartItemVariant: { fontSize: FontSize.sm, marginTop: 4 },
  cartItemPrice: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 4 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: Spacing.sm },
  cartFooter: { borderTopWidth: 1, paddingTop: Spacing.lg, marginTop: Spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  totalLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  totalValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  saleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg,
  },
  saleBtnText: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  historyList: { padding: Spacing.xl, paddingBottom: 100 },
  historyCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  historyIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  historyMeta: { fontSize: FontSize.sm, marginTop: 4 },
  historyTotal: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  historyDetail: { fontSize: FontSize.sm, marginTop: Spacing.sm, marginLeft: 60 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '90%', maxWidth: 440, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  modalSubtitle: { fontSize: FontSize.md, marginBottom: Spacing.lg },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  variantOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1,
  },
  variantOptionInfo: { flex: 1 },
  variantOptionName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  variantOptionPrice: { fontSize: FontSize.md, marginTop: 4 },
  variantOptionStock: { alignItems: 'flex-end' },
  variantStockText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  inCartText: { fontSize: FontSize.sm, marginTop: 4 },
  // Mobile styles
  mobilePosContainer: { flex: 1 },
  mobileTabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden',
  },
  mobileTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg, borderBottomWidth: 2,
  },
  mobileTabText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  mobileContent: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  mobileCartContainer: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.xl,
  },
  cartBadge: {
    backgroundColor: '#ff3b30', borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
});
