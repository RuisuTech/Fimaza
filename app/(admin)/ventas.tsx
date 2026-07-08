import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import { useActivity } from '@/context/ActivityContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function VentasScreen() {
  const { products, decreaseStock } = useProducts();
  const { sales, addSale } = useSales();
  const { log } = useActivity();
  const { user } = useAuth();
  const C = useThemeColors();
  const { t } = useTranslation();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [buyer, setBuyer] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [productListVisible, setProductListVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'error' | 'success'; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const available = useMemo(() => products.filter(p => p.quantity > 0), [products]);
  const filtered = useMemo(() =>
    available.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    ), [available, search]);

  const total = (parseInt(qty) || 0) * (parseFloat(unitPrice) || 0);
  const totalSales = useMemo(() => sales.reduce((s, v) => s + v.total, 0), [sales]);

  const handleSelectProduct = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setUnitPrice('');
    setQty('');
    setBuyer('');
    setProductListVisible(false);
    setModalVisible(true);
  };

  const handleSale = () => {
    if (!selectedProduct) return;
    const saleQty = parseInt(qty) || 0;
    const price = parseFloat(unitPrice) || 0;

    if (saleQty <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'La cantidad debe ser mayor a 0' });
      return;
    }
    if (saleQty > selectedProduct.quantity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Solo hay ' + selectedProduct.quantity + ' unidades' });
      return;
    }
    if (price <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'El precio debe ser mayor a 0' });
      return;
    }
    if (!buyer.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Ingresa el nombre del comprador' });
      return;
    }

    const ok = decreaseStock(selectedProduct.id, saleQty);
    if (!ok) {
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'No se pudo descontar el stock' });
      return;
    }

    addSale({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      quantity: saleQty,
      unitPrice: price,
      total: saleQty * price,
      buyer: buyer.trim(),
      userId: user?.id || '',
    });

    if (user) log(user.id, 'VENTA', `Vendio ${saleQty}x "${selectedProduct.name}" a ${buyer.trim()}`);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    setSelectedProduct(null);
    setQty('');
    setUnitPrice('');
    setBuyer('');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderSale = ({ item }: { item: typeof sales[0] }) => (
    <View style={[styles.saleCard, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.saleHeader}>
        <View style={[styles.saleIcon, { backgroundColor: C.successLight }]}>
          <Ionicons name="cart" size={18} color={C.success} />
        </View>
        <View style={styles.saleInfo}>
          <Text style={[styles.saleName, { color: C.text }]}>{item.productName}</Text>
          <Text style={[styles.saleMeta, { color: C.textMuted }]}>{item.quantity} {t('sales.units')} · {item.buyer}</Text>
        </View>
        <Text style={[styles.saleTotal, { color: C.success }]}>S/ {item.total.toFixed(2)}</Text>
      </View>
      <Text style={[styles.saleTime, { color: C.textMuted }]}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>{t('sales.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{sales.length} {t('dashboard.registers')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: C.accent }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setProductListVisible(true); }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('sales.new')}</Text>
        </TouchableOpacity>
      </View>

      {sales.length > 0 && (
        <View style={[styles.totalCard, { backgroundColor: C.accent }]}>
          <View style={styles.totalLeft}>
            <Ionicons name="cash" size={24} color="#fff" />
            <View>
              <Text style={styles.totalLabel}>{t('sales.totalSales')}</Text>
              <Text style={styles.totalValue}>S/ {totalSales.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('sales.empty')}</Text>
            <Text style={[styles.emptySubtext, { color: C.textMuted }]}>{t('sales.emptyHint')}</Text>
          </View>
        }
      />

      <Modal visible={productListVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{t('sales.selectProduct')}</Text>
              <TouchableOpacity onPress={() => setProductListVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchWrapper, { backgroundColor: C.background, borderColor: C.border }]}>
              <Ionicons name="search" size={18} color={C.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: C.text }]}
                placeholder="Buscar..."
                placeholderTextColor={C.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item: p }) => (
                <TouchableOpacity style={[styles.productItem, { borderBottomColor: C.divider }]} onPress={() => handleSelectProduct(p)} activeOpacity={0.7}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: C.text }]}>{p.name}</Text>
                    <Text style={[styles.productSku, { color: C.textMuted }]}>{p.sku}</Text>
                  </View>
                  <View style={[styles.stockBadge, { backgroundColor: C.accentLight }]}>
                    <Text style={[styles.stockText, { color: C.accent }, p.quantity <= p.minStock && { color: C.danger }]}>{p.quantity}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: C.textMuted }]}>Sin productos disponibles</Text>}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{t('sales.sell')}: {selectedProduct?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={[styles.stockInfo, { backgroundColor: C.accentLight }]}>
                  <Ionicons name="information-circle" size={16} color={C.accent} />
                  <Text style={[styles.stockInfoText, { color: C.accent }]}>{t('sales.stockAvailable')}: {selectedProduct?.quantity}</Text>
                </View>
                <Text style={[styles.label, { color: C.text }]}>{t('sales.quantity')} *</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={qty} onChangeText={setQty} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                <Text style={[styles.label, { color: C.text }]}>{t('sales.unitPrice')} *</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={unitPrice} onChangeText={setUnitPrice} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" />
                <Text style={[styles.label, { color: C.text }]}>{t('sales.buyer')} *</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={buyer} onChangeText={setBuyer} placeholder="Nombre" placeholderTextColor={C.textMuted} />
                {total > 0 && (
                  <View style={[styles.totalRow, { borderTopColor: C.border }]}>
                    <Text style={[styles.totalRowLabel, { color: C.text }]}>{t('sales.total')}</Text>
                    <Text style={[styles.totalRowValue, { color: C.success }]}>S/ {total.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.success }]} onPress={handleSale}>
                <Text style={styles.saveBtnText}>{t('sales.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButtonText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  totalCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  totalLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  totalLabel: { color: '#fff', fontSize: FontSize.sm, opacity: 0.8 },
  totalValue: { color: '#fff', fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  saleCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  saleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  saleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleInfo: { flex: 1 },
  saleName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  saleMeta: { fontSize: FontSize.sm },
  saleTotal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  saleTime: { fontSize: FontSize.xs, marginTop: Spacing.sm, marginLeft: 56 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
  emptySubtext: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeBtn: {
    width: TouchTarget.minimum,
    height: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, height: TouchTarget.minimum, fontSize: FontSize.md, marginLeft: Spacing.sm },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  productSku: { fontSize: FontSize.sm },
  stockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stockText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  form: { gap: Spacing.xs },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  stockInfoText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    minHeight: TouchTarget.minimum,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  totalRowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  totalRowValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minimum,
  },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  saveBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minimum,
  },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
