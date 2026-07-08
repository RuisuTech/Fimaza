import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useActivity } from '@/context/ActivityContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { ProductList } from '@/components/ui';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

type FormData = {
  name: string;
  sku: string;
  quantity: string;
  minStock: string;
  location: string;
  category: string;
  brand: string;
  size: string;
  color: string;
};

const INITIAL_FORM: FormData = { name: '', sku: '', quantity: '', minStock: '', location: '', category: '', brand: '', size: '', color: '' };

export default function ProductosScreen() {
  const { products, addProduct, updateProduct } = useProducts();
  const { log } = useActivity();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string; onConfirm?: () => void }>({
    visible: false, type: 'error', title: '', message: '',
  });
  const C = useThemeColors();
  const { t } = useTranslation();

  const openAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(product.id);
    setForm({
      name: product.name, sku: product.sku,
      quantity: product.quantity.toString(), minStock: product.minStock.toString(),
      location: product.location, category: product.category,
      brand: product.brand, size: product.size, color: product.color,
    });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.sku.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: t('products.nameRequired') });
      return;
    }
    const data = {
      name: form.name.trim(), sku: form.sku.trim(),
      quantity: parseInt(form.quantity) || 0, minStock: parseInt(form.minStock) || 0,
      location: form.location.trim(), category: form.category.trim(),
      brand: form.brand.trim(), size: form.size.trim(), color: form.color.trim(),
    };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingId) {
      updateProduct(editingId, data);
      if (user) log(user.id, 'EDITAR_PRODUCTO', `Edito "${data.name}" (${data.sku})`);
    } else {
      addProduct(data);
      if (user) log(user.id, 'AGREGAR_PRODUCTO', `Agrego "${data.name}" (${data.sku})`);
    }
    setModalVisible(false);
    setForm(INITIAL_FORM);
    setEditingId(null);
  }, [form, editingId, user, addProduct, updateProduct, log, t]);

  const setField = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('products.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{products.length} {t('products.count')}</Text>
      </View>

      <ProductList products={products} onProductPress={openEdit} onAddPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{editingId ? t('products.edit') : t('products.create')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.name')} *</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.name} onChangeText={v => setField('name', v)} placeholder="Ej: Nike Air Max 90" placeholderTextColor={C.textMuted} />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.brand')} *</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.brand} onChangeText={v => setField('brand', v)} placeholder="Ej: Nike" placeholderTextColor={C.textMuted} />
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.sku')} *</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.sku} onChangeText={v => setField('sku', v)} placeholder="Ej: NK-AM90-001" placeholderTextColor={C.textMuted} autoCapitalize="characters" />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.size')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.size} onChangeText={v => setField('size', v)} placeholder="Ej: 42" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.color')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.color} onChangeText={v => setField('color', v)} placeholder="Ej: Blanco" placeholderTextColor={C.textMuted} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.quantity')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.quantity} onChangeText={v => setField('quantity', v)} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.minStock')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.minStock} onChangeText={v => setField('minStock', v)} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.category')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.category} onChangeText={v => setField('category', v)} placeholder="Ej: Running" placeholderTextColor={C.textMuted} />
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.location')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.location} onChangeText={v => setField('location', v)} placeholder="Ej: Tienda Principal" placeholderTextColor={C.textMuted} />
                </View>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? t('settings.save') : 'Crear'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertState.visible} type={alertState.type} title={alertState.title}
        message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
        onConfirm={alertState.onConfirm} showCancel={!!alertState.onConfirm}
        confirmText={alertState.onConfirm ? t('common.delete') : t('common.confirm')}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 520, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.md, minHeight: TouchTarget.minimum },
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: TouchTarget.minimum },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  saveBtn: { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: TouchTarget.minimum },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
