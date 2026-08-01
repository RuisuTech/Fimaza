import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useActivity } from '@/context/ActivityContext';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { collaboratorNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function MovimientosScreen() {
  const { products, updateProduct } = useProducts();
  const { log } = useActivity();
  const { user } = useAuth();
  const C = useThemeColors();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState('');
  const [type, setType] = useState<'entrada' | 'salida'>('entrada');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setQty('');
    setType('entrada');
    setModalVisible(true);
  };

  const handleSave = () => {
    const amount = parseInt(qty) || 0;
    if (amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: t('movements.qtyMustBePositive') });
      return;
    }

    const newQty = type === 'entrada'
      ? selectedProduct.quantity + amount
      : selectedProduct.quantity - amount;

    if (newQty < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: t('movements.insufficientStock') });
      return;
    }

    updateProduct(selectedProduct.id, { quantity: newQty });
    if (user) log(user.id, 'STOCK_UPDATE', `${type === 'entrada' ? t('movements.entry') : t('movements.exit')} de ${amount}x "${selectedProduct.name}"`);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    setSelectedProduct(null);
    setQty('');
  };

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('movements.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('movements.subtitle')}</Text>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: searchFocused ? C.accent : C.border }]}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
          placeholder={t('movements.searchPlaceholder')}
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          underlineColorAndroid="transparent"
          selectionColor={C.accent}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.map(product => (
          <TouchableOpacity key={product.id} style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => handleSelect(product)} activeOpacity={0.7}>
            <View style={[styles.cardIcon, { backgroundColor: C.accentLight }]}>
              <Ionicons name="cube" size={20} color={C.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: C.text }]}>{product.name}</Text>
              <Text style={[styles.cardMeta, { color: C.textMuted }]}>Stock: {product.quantity}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{t('movements.registerMovement')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={[styles.productName, { color: C.text }]}>{selectedProduct?.name}</Text>
              <Text style={[styles.stockInfo, { color: C.textMuted }]}>{t('movements.currentStock')}: {selectedProduct?.quantity}</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'entrada' && styles.typeBtnActive, { borderColor: C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setType('entrada'); }}
                >
                  <Ionicons name="add-circle" size={20} color={type === 'entrada' ? '#fff' : C.success} />
                  <Text style={[styles.typeText, type === 'entrada' && styles.typeTextActive, { color: type === 'entrada' ? '#fff' : C.text }]}>{t('movements.entry')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'salida' && styles.typeBtnActiveSalida, { borderColor: C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setType('salida'); }}
                >
                  <Ionicons name="remove-circle" size={20} color={type === 'salida' ? '#fff' : C.danger} />
                  <Text style={[styles.typeText, type === 'salida' && styles.typeTextActive, { color: type === 'salida' ? '#fff' : C.text }]}>{t('movements.exit')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.label, { color: C.text }]}>{t('movements.quantity')}</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={qty} onChangeText={setQty} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="numeric" />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal visible={alertState.visible} type={alertState.type} title={alertState.title} message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))} />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  searchInput: { flex: 1, height: TouchTarget.minimum, fontSize: FontSize.md, marginLeft: Spacing.sm },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '90%', maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.xs },
  productName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockInfo: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  typeBtnActive: { backgroundColor: Colors.light.success, borderColor: Colors.light.success },
  typeBtnActiveSalida: { backgroundColor: Colors.light.danger, borderColor: Colors.light.danger },
  typeText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  typeTextActive: { color: '#fff' },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, minHeight: TouchTarget.minimum,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: TouchTarget.minimum,
  },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  saveBtn: {
    flex: 1, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: TouchTarget.minimum,
  },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
