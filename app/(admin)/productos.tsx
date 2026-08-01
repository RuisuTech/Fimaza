import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/context/ProductsContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useInventory } from '@/context/InventoryContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { Producto } from '@/types';

type FormData = {
  nombre: string;
  descripcion: string;
  id_marca: number;
  id_categoria: number;
  id_genero: number;
};

type VariantForm = {
  id_talla: number;
  id_color: number;
  codigo_barras: string;
  precio_compra: string;
  precio_venta: string;
  stock_inicial: string;
  stock_minimo: string;
};

const EMPTY_FORM: FormData = { nombre: '', descripcion: '', id_marca: 0, id_categoria: 0, id_genero: 0 };
const EMPTY_VARIANT: VariantForm = { id_talla: 0, id_color: 0, codigo_barras: '', precio_compra: '', precio_venta: '', stock_inicial: '', stock_minimo: '5' };

export default function ProductosScreen() {
  const { products, variants, inventory, addProduct, updateProduct, toggleProductStatus, addVariant, deleteVariant } = useProducts();
  const { marcas, categorias, generos, tallas, colores } = useCatalogs();
  const { user } = useAuth();
  const { log } = useActivity();
  const { addMovement } = useInventory();
  const C = useThemeColors();
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [filterMarca, setFilterMarca] = useState<number | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT);

  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string; onConfirm?: () => void }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        variants.some(v => v.id_producto === p.id && v.codigo_barras?.toLowerCase().includes(search.toLowerCase()));
      const matchMarca = !filterMarca || p.id_marca === filterMarca;
      const matchCategoria = !filterCategoria || p.id_categoria === filterCategoria;
      return matchSearch && matchMarca && matchCategoria;
    });
  }, [products, variants, search, filterMarca, filterCategoria]);

  const getMarcaName = (id: number) => marcas.find(m => m.id === id)?.nombre_marca || '';
  const getCategoriaName = (id: number) => categorias.find(c => c.id === id)?.nombre_categoria || '';
  const getGeneroName = (id: number) => generos.find(g => g.id === id)?.nombre_genero || '';
  const getTallaName = (id: number) => tallas.find(t => t.id === id)?.numero_talla || '';
  const getColorName = (id: number) => colores.find(c => c.id === id)?.nombre_color || '';
  const getTotalStock = (productId: number) => {
    const pVariants = variants.filter(v => v.id_producto === productId);
    return pVariants.reduce((sum, v) => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return sum + (inv?.stock_actual || 0);
    }, 0);
  };

  const openCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((product: Producto) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProduct(product);
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      id_marca: product.id_marca,
      id_categoria: product.id_categoria,
      id_genero: product.id_genero,
    });
    setModalVisible(true);
  }, []);

  const handleSaveProduct = useCallback(() => {
    if (!form.nombre.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'El nombre es obligatorio' });
      return;
    }
    if (!form.id_marca || !form.id_categoria || !form.id_genero) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Selecciona marca, categoria y genero' });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingProduct) {
      updateProduct(editingProduct.id, form);
      if (user) log(user.employeeId!, 'PRODUCT_UPDATED', `Producto "${form.nombre}" editado`);
    } else {
      addProduct({ ...form, estado: true });
      if (user) log(user.employeeId!, 'PRODUCT_CREATED', `Producto "${form.nombre}" creado`);
    }
    setModalVisible(false);
    setForm(EMPTY_FORM);
    setEditingProduct(null);
  }, [form, editingProduct, addProduct, updateProduct, t]);

  const openVariants = useCallback((product: Producto) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setVariantForm(EMPTY_VARIANT);
    setVariantModalVisible(true);
  }, []);

  const handleAddVariant = useCallback(() => {
    if (!selectedProduct) return;
    if (!variantForm.id_talla || !variantForm.id_color) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Selecciona talla y color' });
      return;
    }
    const pc = parseFloat(variantForm.precio_compra) || 0;
    const pv = parseFloat(variantForm.precio_venta) || 0;
    if (pc <= 0 || pv <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Los precios deben ser mayores a 0' });
      return;
    }
    if (pv < pc) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'El precio de venta debe ser mayor o igual al de compra' });
      return;
    }
    const stockInicial = parseInt(variantForm.stock_inicial) || 0;
    const stockMinimo = parseInt(variantForm.stock_minimo) || 5;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newVariant = addVariant({
      id_producto: selectedProduct.id,
      id_talla: variantForm.id_talla,
      id_color: variantForm.id_color,
      codigo_barras: variantForm.codigo_barras.trim() || undefined,
      precio_compra: pc,
      precio_venta: pv,
    }, stockInicial, stockMinimo);
    if (stockInicial > 0 && user) {
      const inv = inventory.find(i => i.id_variante === newVariant.id);
      if (inv) {
        addMovement({
          id_inventario: inv.id,
          id_tipo_movimiento: 1,
          id_empleado: user.employeeId || parseInt(user.id),
          cantidad: stockInicial,
          observaciones: 'Stock inicial al crear variante',
        });
      }
    }
    const tallaName = tallas.find(t => t.id === variantForm.id_talla)?.numero_talla || '';
    const colorName = colores.find(c => c.id === variantForm.id_color)?.nombre_color || '';
    if (user) {
      const detail = stockInicial > 0
        ? `Variante ${tallaName}/${colorName} en "${selectedProduct.nombre}" con ${stockInicial} pares`
        : `Variante ${tallaName}/${colorName} en "${selectedProduct.nombre}"`;
      log(user.employeeId!, 'VARIANT_CREATED', detail);
    }
    setVariantForm(EMPTY_VARIANT);
  }, [selectedProduct, variantForm, addVariant, t, tallas, colores, user, log, addMovement, inventory]);

  const handleDeleteVariant = useCallback((variantId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAlertState({
      visible: true, type: 'warning', title: 'Eliminar variante?',
      message: 'Se eliminara la variante y su inventario asociado',
      onConfirm: () => {
        deleteVariant(variantId);
        if (user) log(user.employeeId!, 'VARIANT_DELETED', `Variante #${variantId} eliminada`);
        setAlertState(prev => ({ ...prev, visible: false }));
      },
    });
  }, [deleteVariant, user, log]);

  const renderProduct = ({ item }: { item: Producto }) => {
    const pVariants = variants.filter(v => v.id_producto === item.id);
    const totalStock = getTotalStock(item.id);
    const isLow = pVariants.some(v => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return inv && inv.stock_actual <= inv.stock_minimo;
    });

    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: isLow ? C.dangerLight : C.accentLight }]}>
            <Ionicons name="cube" size={20} color={isLow ? C.danger : C.accent} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{item.nombre}</Text>
            <Text style={[styles.cardMeta, { color: C.textMuted }]}>
              {getMarcaName(item.id_marca)} · {getCategoriaName(item.id_categoria)} · {getGeneroName(item.id_genero)}
            </Text>
          </View>
          <View style={styles.stockBadge}>
            <Text style={[styles.stockValue, { color: isLow ? C.danger : C.text }]}>{totalStock}</Text>
            <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
          </View>
        </View>

        <View style={styles.variantsSummary}>
          <Text style={[styles.variantsLabel, { color: C.textMuted }]}>{pVariants.length} variantes</Text>
          <View style={styles.variantsChips}>
            {pVariants.slice(0, 4).map(v => (
              <View key={v.id} style={[styles.variantChip, { backgroundColor: C.accentLight }]}>
                <Text style={[styles.variantChipText, { color: C.accent }]}>
                  {getTallaName(v.id_talla)}-{getColorName(v.id_color)}
                </Text>
              </View>
            ))}
            {pVariants.length > 4 && (
              <Text style={[styles.moreVariants, { color: C.textMuted }]}>+{pVariants.length - 4}</Text>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.accentLight }]} onPress={() => openVariants(item)} activeOpacity={0.7}>
            <Ionicons name="layers-outline" size={16} color={C.accent} />
            <Text style={[styles.actionText, { color: C.accent }]}>Variantes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={C.textSecondary} />
            <Text style={[styles.actionText, { color: C.textSecondary }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: item.estado ? C.successLight : C.dangerLight }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleProductStatus(item.id);
              if (user) log(user.employeeId!, 'PRODUCT_TOGGLED', `Producto "${item.nombre}" ${item.estado ? 'desactivado' : 'activado'}`);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={item.estado ? 'checkmark-circle-outline' : 'close-circle-outline'} size={16} color={item.estado ? C.success : C.danger} />
            <Text style={[styles.actionText, { color: item.estado ? C.success : C.danger }]}>{item.estado ? 'Activo' : 'Inactivo'}</Text>
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
            <Text style={[styles.title, { color: C.text }]}>{t('products.title')}</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>{products.length} {t('products.count')}</Text>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: C.accent }]} onPress={openCreate} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>{t('products.new')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder={t('products.search')}
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Ionicons name="close-circle" size={18} color={C.textMuted} onPress={() => setSearch('')} />
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: !filterMarca && !filterCategoria ? C.accent : C.surface, borderColor: !filterMarca && !filterCategoria ? C.accent : C.border }]}
            onPress={() => { setFilterMarca(null); setFilterCategoria(null); }}
          >
            <Text style={[styles.filterText, { color: !filterMarca && !filterCategoria ? '#fff' : C.text }]}>Todas</Text>
          </TouchableOpacity>
          {marcas.filter(m => m.estado).map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.filterChip, { backgroundColor: filterMarca === m.id ? C.accent : C.surface, borderColor: filterMarca === m.id ? C.accent : C.border }]}
              onPress={() => setFilterMarca(filterMarca === m.id ? null : m.id)}
            >
              <Text style={[styles.filterText, { color: filterMarca === m.id ? '#fff' : C.text }]}>{m.nombre_marca}</Text>
            </TouchableOpacity>
          ))}
          {categorias.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, { backgroundColor: filterCategoria === c.id ? C.success : C.surface, borderColor: filterCategoria === c.id ? C.success : C.border }]}
              onPress={() => setFilterCategoria(filterCategoria === c.id ? null : c.id)}
            >
              <Text style={[styles.filterText, { color: filterCategoria === c.id ? '#fff' : C.text }]}>{c.nombre_categoria}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={renderProduct}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Product Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{editingProduct ? t('products.edit') : t('products.create')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.name')} *</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.nombre} onChangeText={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Ej: Nike Air Max 90" placeholderTextColor={C.textMuted} />

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.brand')} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {marcas.filter(m => m.estado).map(m => (
                    <TouchableOpacity key={m.id} style={[styles.pickerChip, { backgroundColor: form.id_marca === m.id ? C.accent : C.surface, borderColor: form.id_marca === m.id ? C.accent : C.border }]} onPress={() => setForm(p => ({ ...p, id_marca: m.id }))}>
                      <Text style={[styles.pickerText, { color: form.id_marca === m.id ? '#fff' : C.text }]}>{m.nombre_marca}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('products.category')} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {categorias.map(c => (
                    <TouchableOpacity key={c.id} style={[styles.pickerChip, { backgroundColor: form.id_categoria === c.id ? C.accent : C.surface, borderColor: form.id_categoria === c.id ? C.accent : C.border }]} onPress={() => setForm(p => ({ ...p, id_categoria: c.id }))}>
                      <Text style={[styles.pickerText, { color: form.id_categoria === c.id ? '#fff' : C.text }]}>{c.nombre_categoria}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: C.textSecondary }]}>Genero *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {generos.filter(g => g.estado).map(g => (
                    <TouchableOpacity key={g.id} style={[styles.pickerChip, { backgroundColor: form.id_genero === g.id ? C.accent : C.surface, borderColor: form.id_genero === g.id ? C.accent : C.border }]} onPress={() => setForm(p => ({ ...p, id_genero: g.id }))}>
                      <Text style={[styles.pickerText, { color: form.id_genero === g.id ? '#fff' : C.text }]}>{g.nombre_genero}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: C.textSecondary }]}>Descripcion</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.descripcion} onChangeText={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Descripcion opcional" placeholderTextColor={C.textMuted} multiline numberOfLines={3} />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSaveProduct}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Variants Modal */}
      <Modal visible={variantModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: C.text }]}>Variantes</Text>
                <Text style={[styles.modalSubtitle, { color: C.textMuted }]}>{selectedProduct?.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setVariantModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProduct && variants.filter(v => v.id_producto === selectedProduct.id).map(v => {
                const inv = inventory.find(i => i.id_variante === v.id);
                return (
                  <View key={v.id} style={[styles.variantRow, { backgroundColor: C.background, borderColor: C.border }]}>
                    <View style={styles.variantInfo}>
                      <Text style={[styles.variantName, { color: C.text }]}>
                        Talla {getTallaName(v.id_talla)} · {getColorName(v.id_color)}
                      </Text>
                      <Text style={[styles.variantMeta, { color: C.textMuted }]}>
                        {v.codigo_barras || 'S/S'} · Compra: S/ {v.precio_compra.toFixed(2)} · Venta: S/ {v.precio_venta.toFixed(2)}
                      </Text>
                      <Text style={[styles.variantStock, { color: (inv?.stock_actual || 0) <= (inv?.stock_minimo || 5) ? C.danger : C.success }]}>
                        Stock: {inv?.stock_actual || 0} (min: {inv?.stock_minimo || 5})
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteVariant(v.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color={C.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={[styles.addVariantSection, { borderTopColor: C.border }]}>
                <Text style={[styles.addVariantTitle, { color: C.text }]}>Agregar variante</Text>
                <View style={styles.pickerRow}>
                  <Text style={[styles.label, { color: C.textSecondary, flex: 0 }]}>Talla:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tallas.map(t => (
                      <TouchableOpacity key={t.id} style={[styles.pickerChip, { backgroundColor: variantForm.id_talla === t.id ? C.accent : C.surface, borderColor: variantForm.id_talla === t.id ? C.accent : C.border }]} onPress={() => setVariantForm(p => ({ ...p, id_talla: t.id }))}>
                        <Text style={[styles.pickerText, { color: variantForm.id_talla === t.id ? '#fff' : C.text }]}>{t.numero_talla}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.pickerRow}>
                  <Text style={[styles.label, { color: C.textSecondary, flex: 0 }]}>Color:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {colores.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.pickerChip, { backgroundColor: variantForm.id_color === c.id ? C.accent : C.surface, borderColor: variantForm.id_color === c.id ? C.accent : C.border }]} onPress={() => setVariantForm(p => ({ ...p, id_color: c.id }))}>
                        <Text style={[styles.pickerText, { color: variantForm.id_color === c.id ? '#fff' : C.text }]}>{c.nombre_color}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: C.textSecondary }]}>Codigo barras</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={variantForm.codigo_barras} onChangeText={v => setVariantForm(p => ({ ...p, codigo_barras: v }))} placeholder="Opcional" placeholderTextColor={C.textMuted} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: C.textSecondary }]}>P. Compra *</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={variantForm.precio_compra} onChangeText={v => setVariantForm(p => ({ ...p, precio_compra: v }))} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" />
                  </View>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: C.textSecondary }]}>P. Venta *</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={variantForm.precio_venta} onChangeText={v => setVariantForm(p => ({ ...p, precio_venta: v }))} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: C.textSecondary }]}>Stock inicial</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={variantForm.stock_inicial} onChangeText={v => setVariantForm(p => ({ ...p, stock_inicial: v }))} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="number-pad" />
                  </View>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: C.textSecondary }]}>Stock minimo</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={variantForm.stock_minimo} onChangeText={v => setVariantForm(p => ({ ...p, stock_minimo: v }))} placeholder="5" placeholderTextColor={C.textMuted} keyboardType="number-pad" />
                  </View>
                </View>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.success }]} onPress={handleAddVariant}>
                  <Text style={styles.saveBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertState.visible} type={alertState.type} title={alertState.title}
        message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
        onConfirm={alertState.onConfirm} showCancel={!!alertState.onConfirm}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
  },
  addButtonText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.lg, marginLeft: Spacing.md },
  filtersRow: { marginBottom: Spacing.lg, maxHeight: 44 },
  filtersContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.lg, height: 36,
    borderRadius: BorderRadius.md, borderWidth: 1, justifyContent: 'center',
  },
  filterText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  listContainer: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  listContent: { padding: Spacing.sm },
  card: {
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  cardMeta: { fontSize: FontSize.sm },
  stockBadge: { alignItems: 'flex-end' },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockLabel: { fontSize: FontSize.sm },
  variantsSummary: { marginTop: Spacing.md },
  variantsLabel: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  variantsChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  variantChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  variantChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  moreVariants: { fontSize: FontSize.sm, alignSelf: 'center' },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 520, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  modalSubtitle: { fontSize: FontSize.md, marginTop: 4 },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.sm },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.lg, minHeight: 44 },
  row: { flexDirection: 'row', gap: Spacing.lg },
  half: { flex: 1 },
  pickerRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  pickerChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  pickerText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  saveBtn: { flex: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  variantRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm,
  },
  variantInfo: { flex: 1 },
  variantName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  variantMeta: { fontSize: FontSize.sm, marginTop: 4 },
  variantStock: { fontSize: FontSize.sm, marginTop: 4, fontWeight: FontWeight.medium },
  deleteBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  addVariantSection: { marginTop: Spacing.xl, paddingTop: Spacing.xl, borderTopWidth: 1 },
  addVariantTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
});
