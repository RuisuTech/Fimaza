import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useInventory } from '@/context/InventoryContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { Inventario } from '@/types';

export default function InventarioScreen() {
  const { products, variants, inventory, increaseStock, decreaseStock } = useProducts();
  const { movements, addMovement } = useInventory();
  const { marcas, tallas, colores, tiposMovimiento } = useCatalogs();
  const { user } = useAuth();
  const { log } = useActivity();
  const C = useThemeColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventario | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [movementQty, setMovementQty] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  const [selectedTipoMovimiento, setSelectedTipoMovimiento] = useState<number>(1);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyInventory, setHistoryInventory] = useState<Inventario | null>(null);

  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const getTallaName = useCallback((id: number) => tallas.find(t => t.id === id)?.numero_talla || '', [tallas]);
  const getColorName = useCallback((id: number) => colores.find(c => c.id === id)?.nombre_color || '', [colores]);
  const getMarcaName = useCallback((id: number) => marcas.find(m => m.id === id)?.nombre_marca || '', [marcas]);
  const getTipoMovimiento = useCallback((id: number) => tiposMovimiento.find(t => t.id === id), [tiposMovimiento]);

  const stockData = useMemo(() => {
    return inventory.map(inv => {
      const variant = variants.find(v => v.id === inv.id_variante);
      const product = variant ? products.find(p => p.id === variant.id_producto) : null;
      return { inventory: inv, variant, product };
    }).filter(item => item.variant && item.product);
  }, [inventory, variants, products]);

  const filteredStock = useMemo(() => {
    if (!search) return stockData;
    const s = search.toLowerCase();
    return stockData.filter(item => {
      const productName = item.product?.nombre.toLowerCase() || '';
      const marcaName = item.product ? getMarcaName(item.product.id_marca).toLowerCase() : '';
      const tallaName = item.variant ? getTallaName(item.variant.id_talla).toLowerCase() : '';
      const colorName = item.variant ? getColorName(item.variant.id_color).toLowerCase() : '';
      const barcode = item.variant?.codigo_barras?.toLowerCase() || '';
      return productName.includes(s) || marcaName.includes(s) || tallaName.includes(s) || colorName.includes(s) || barcode.includes(s);
    });
  }, [stockData, search, getMarcaName, getTallaName, getColorName]);

  const lowStockCount = useMemo(() => stockData.filter(item => item.inventory.stock_actual <= item.inventory.stock_minimo).length, [stockData]);
  const totalUnits = useMemo(() => stockData.reduce((sum, item) => sum + item.inventory.stock_actual, 0), [stockData]);
  const totalInventoryValue = useMemo(() => stockData.reduce((sum, item) => sum + (item.inventory.stock_actual * (item.variant?.precio_compra || 0)), 0), [stockData]);

  const getVariantForInventory = useCallback((inv: Inventario) => {
    return stockData.find(item => item.inventory.id === inv.id)?.variant;
  }, [stockData]);

  const openMovementModal = (inv: Inventario, type: 'entrada' | 'salida') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInventory(inv);
    setMovementType(type);
    setMovementQty('');
    setMovementNotes('');
    const defaultTipo = type === 'entrada' ? 1 : 4;
    setSelectedTipoMovimiento(defaultTipo);
    setMovementModalVisible(true);
  };

  const handleSaveMovement = () => {
    if (!selectedInventory || !user) return;
    const qty = parseInt(movementQty) || 0;
    if (qty <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'La cantidad debe ser mayor a 0' });
      return;
    }
    if (movementType === 'salida' && selectedInventory.stock_actual < qty) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Stock insuficiente' });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (movementType === 'entrada') {
      increaseStock(selectedInventory.id_variante, qty);
      log(user.employeeId!, 'STOCK_UPDATE', `Entrada de ${qty} unidades - Variante #${selectedInventory.id_variante}`);
    } else {
      decreaseStock(selectedInventory.id_variante, qty);
      log(user.employeeId!, 'STOCK_UPDATE', `Salida de ${qty} unidades - Variante #${selectedInventory.id_variante}`);
    }

    addMovement({
      id_inventario: selectedInventory.id,
      id_tipo_movimiento: selectedTipoMovimiento,
      id_empleado: user.employeeId || parseInt(user.id),
      cantidad: qty,
      observaciones: movementNotes.trim() || undefined,
    });

    setMovementModalVisible(false);
    setSelectedInventory(null);
    setMovementQty('');
    setMovementNotes('');
  };

  const openHistory = (inv: Inventario) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistoryInventory(inv);
    setHistoryModalVisible(true);
  };

  const getHistoryForInventory = (invId: number) => {
    return movements
      .filter(m => m.id_inventario === invId)
      .sort((a, b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime());
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderStockItem = ({ item }: { item: typeof stockData[0] }) => {
    const isLow = item.inventory.stock_actual <= item.inventory.stock_minimo;
    return (
      <View style={[styles.stockCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.stockHeader}>
          <View style={[styles.stockIcon, { backgroundColor: isLow ? C.dangerLight : C.accentLight }]}>
            <Ionicons name="cube" size={18} color={isLow ? C.danger : C.accent} />
          </View>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockName, { color: C.text }]} numberOfLines={1}>{item.product?.nombre}</Text>
            <Text style={[styles.stockMeta, { color: C.textMuted }]}>
              {getMarcaName(item.product?.id_marca || 0)} · {getTallaName(item.variant?.id_talla || 0)} · {getColorName(item.variant?.id_color || 0)}
            </Text>
          </View>
        </View>
        <View style={styles.stockNumbers}>
          <View style={styles.stockQuantity}>
            <Text style={[styles.stockValue, { color: isLow ? C.danger : C.text }]}>{item.inventory.stock_actual}</Text>
            <Text style={[styles.stockLabel, { color: C.textMuted }]}>actual</Text>
          </View>
          <View style={styles.stockQuantity}>
            <Text style={[styles.stockMin, { color: C.textMuted }]}>{item.inventory.stock_minimo}</Text>
            <Text style={[styles.stockLabel, { color: C.textMuted }]}>minimo</Text>
          </View>
          {item.variant && (
            <>
              <View style={styles.stockQuantity}>
                <Text style={[styles.stockValue, { color: C.text }]}>S/ {item.variant.precio_compra.toFixed(2)}</Text>
                <Text style={[styles.stockLabel, { color: C.textMuted }]}>compra</Text>
              </View>
              <View style={styles.stockQuantity}>
                <Text style={[styles.stockValue, { color: C.success }]}>S/ {item.variant.precio_venta.toFixed(2)}</Text>
                <Text style={[styles.stockLabel, { color: C.textMuted }]}>venta</Text>
              </View>
              <View style={styles.stockQuantity}>
                <Text style={[styles.stockValue, { color: C.accent }]}>
                  {item.variant.precio_compra > 0 ? (((item.variant.precio_venta - item.variant.precio_compra) / item.variant.precio_compra) * 100).toFixed(0) : '0'}%
                </Text>
                <Text style={[styles.stockLabel, { color: C.textMuted }]}>margen</Text>
              </View>
            </>
          )}
        </View>
        <View style={styles.stockActions}>
          <TouchableOpacity style={[styles.stockActionBtn, { backgroundColor: C.successLight }]} onPress={() => openMovementModal(item.inventory, 'entrada')} activeOpacity={0.7}>
            <Ionicons name="add-circle" size={16} color={C.success} />
            <Text style={[styles.stockActionText, { color: C.success }]}>{t('inventory.entry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stockActionBtn, { backgroundColor: C.dangerLight }]} onPress={() => openMovementModal(item.inventory, 'salida')} activeOpacity={0.7}>
            <Ionicons name="remove-circle" size={16} color={C.danger} />
            <Text style={[styles.stockActionText, { color: C.danger }]}>{t('inventory.exit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stockActionBtn, { backgroundColor: C.accentLight }]} onPress={() => openHistory(item.inventory)} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={16} color={C.accent} />
            <Text style={[styles.stockActionText, { color: C.accent }]}>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.text }]}>{t('inventory.title')}</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('inventory.stockGeneral')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent }]}>
            <Text style={[styles.statValue, { color: C.text }]}>{stockData.length}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('inventory.totalProducts')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.success }]}>
            <Text style={[styles.statValue, { color: C.text }]}>{totalUnits}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('inventory.totalUnits')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.warning }]}>
            <Text style={[styles.statValue, { color: C.text }]}>S/ {totalInventoryValue.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Inversion</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.danger }]}>
            <Text style={[styles.statValue, { color: C.danger }]}>{lowStockCount}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('inventory.lowStock')}</Text>
          </View>
        </View>

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
          {search.length > 0 && (
            <Ionicons name="close-circle" size={18} color={C.textMuted} onPress={() => setSearch('')} />
          )}
        </View>

        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={filteredStock}
            keyExtractor={item => item.inventory.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={renderStockItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="layers-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('inventory.totalProducts')}: 0</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Movement Modal */}
      <Modal visible={movementModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>
                {movementType === 'entrada' ? t('inventory.addEntry') : t('inventory.addExit')}
              </Text>
              <TouchableOpacity onPress={() => setMovementModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedInventory && (() => {
              const variant = getVariantForInventory(selectedInventory);
              const qty = parseInt(movementQty) || 0;
              const totalCost = (variant?.precio_compra || 0) * qty;
              return (
              <View style={styles.form}>
                <View style={[styles.infoBox, { backgroundColor: C.accentLight }]}>
                  <Ionicons name="information-circle" size={16} color={C.accent} />
                  <Text style={[styles.infoText, { color: C.accent }]}>
                    Stock actual: {selectedInventory.stock_actual}
                  </Text>
                </View>

                {variant && (
                  <View style={[styles.infoBox, { backgroundColor: movementType === 'entrada' ? C.successLight : C.dangerLight }]}>
                    <Ionicons name={movementType === 'entrada' ? 'trending-up' : 'trending-down'} size={16} color={movementType === 'entrada' ? C.success : C.danger} />
                    <Text style={[styles.infoText, { color: movementType === 'entrada' ? C.success : C.danger }]}>
                      {movementType === 'entrada' ? 'Compra' : 'Merma'}: S/ {variant.precio_compra.toFixed(2)} × {qty || 0} = S/ {totalCost.toFixed(2)}
                    </Text>
                  </View>
                )}

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('inventory.type')} *</Text>
                <View style={styles.typeRow}>
                  {tiposMovimiento.filter(t => t.naturaleza === (movementType === 'entrada' ? 'Entrada' : 'Salida')).map(tipo => (
                    <TouchableOpacity
                      key={tipo.id}
                      style={[styles.typeChip, { backgroundColor: selectedTipoMovimiento === tipo.id ? C.accent : C.surface, borderColor: selectedTipoMovimiento === tipo.id ? C.accent : C.border }]}
                      onPress={() => setSelectedTipoMovimiento(tipo.id)}
                    >
                      <Text style={[styles.typeChipText, { color: selectedTipoMovimiento === tipo.id ? '#fff' : C.text }]}>{tipo.nombre_movimiento}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('inventory.quantity')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                  value={movementQty}
                  onChangeText={setMovementQty}
                  placeholder="0"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                />

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('inventory.notes')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                  value={movementNotes}
                  onChangeText={setMovementNotes}
                  placeholder="Observaciones opcionales"
                  placeholderTextColor={C.textMuted}
                />
              </View>
              );
            })()}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setMovementModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: movementType === 'entrada' ? C.success : C.danger }]} onPress={handleSaveMovement}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{t('inventory.history')}</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {historyInventory && getHistoryForInventory(historyInventory.id).map(mov => {
                const tipo = getTipoMovimiento(mov.id_tipo_movimiento);
                const isEntrada = tipo?.naturaleza === 'Entrada';
                return (
                  <View key={mov.id} style={[styles.historyRow, { backgroundColor: C.background, borderColor: C.border }]}>
                    <View style={[styles.historyIcon, { backgroundColor: isEntrada ? C.successLight : C.dangerLight }]}>
                      <Ionicons name={isEntrada ? 'arrow-down' : 'arrow-up'} size={16} color={isEntrada ? C.success : C.danger} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyType, { color: C.text }]}>{tipo?.nombre_movimiento || 'Movimiento'}</Text>
                      <Text style={[styles.historyDate, { color: C.textMuted }]}>{formatDate(mov.fecha_movimiento)}</Text>
                      {mov.observaciones && <Text style={[styles.historyNotes, { color: C.textMuted }]}>{mov.observaciones}</Text>}
                    </View>
                    <Text style={[styles.historyQty, { color: isEntrada ? C.success : C.danger }]}>
                      {isEntrada ? '+' : '-'}{mov.cantidad}
                    </Text>
                  </View>
                );
              })}
              {historyInventory && getHistoryForInventory(historyInventory.id).length === 0 && (
                <Text style={[styles.emptyText, { color: C.textMuted, textAlign: 'center', paddingVertical: 40 }]}>Sin movimientos registrados</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertState.visible} type={alertState.type} title={alertState.title}
        message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, minWidth: 140, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderLeftWidth: 3, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.sm, marginTop: 4 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.lg, marginLeft: Spacing.md },
  listContainer: { flex: 1, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  listContent: { padding: Spacing.sm },
  stockCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1 },
  stockHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg },
  stockIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  stockMeta: { fontSize: FontSize.sm, marginTop: 4 },
  stockNumbers: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, marginBottom: Spacing.lg },
  stockQuantity: { alignItems: 'center' },
  stockValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  stockMin: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  stockLabel: { fontSize: FontSize.sm },
  stockActions: { flexDirection: 'row', gap: Spacing.md },
  stockActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  stockActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl, maxHeight: '80%', width: '90%', maxWidth: 440,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.sm },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  infoText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.lg, minHeight: 44 },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeChip: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  typeChipText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  saveBtn: { flex: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm },
  historyIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  historyInfo: { flex: 1 },
  historyType: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  historyDate: { fontSize: FontSize.sm, marginTop: 4 },
  historyNotes: { fontSize: FontSize.sm, marginTop: 4 },
  historyQty: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
