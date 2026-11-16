import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AdminTopNav from '@/components/AdminTopNav';
import AlertModal from '@/components/AlertModal';
import ModuleTabs from '@/components/admin/ModuleTabs';
import { gestionTabs } from '@/constants/adminTabs';
import { useProducts } from '@/context/ProductsContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { Producto, ProductoVariante, Inventario, Marca, Talla, Color } from '@/types';

const PALETTE = {
  page: '#f4f5f7',
  card: '#ffffff',
  cardBorder: '#D5DCE6',
  cardHeader: '#EEF2F7',
  cardHeaderText: '#334155',
  heading: '#0B2545',
  text: '#1f2937',
  textMuted: '#475569',
  placeholder: '#94a3b8',
  inputBorder: '#D5DCE6',
  active: '#255bb3',
  white: '#ffffff',
  tableHead: '#E8EEF6',
  rowBorder: '#EEF2F7',
  sizeBg: '#f8fafc',
  sizeBorder: '#D5DCE6',
  stockLowBg: '#fef2f2',
  stockLowText: '#b91c1c',
  stockOkBg: '#ecfdf5',
  stockOkText: '#047857',
  statusActiveBg: '#dcfce7',
  statusActiveText: '#166534',
  statusInactiveBg: '#f1f5f9',
  statusInactiveText: '#64748b',
};

const CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
  : Shadows.sm;

type FormData = {
  codigo: string;
  modelo: string;
  marca: string;
  talla: string;
  color: string;
  precio_venta: string;
  stock_inicial: string;
  stock_minimo: string;
  estado: boolean;
};

const EMPTY_FORM: FormData = {
  codigo: '',
  modelo: '',
  marca: '',
  talla: '',
  color: '',
  precio_venta: '',
  stock_inicial: '0',
  stock_minimo: '5',
  estado: true,
};

type EditingSnapshot = {
  productId: number;
  variantId: number;
};

type ProductRow = {
  variant: ProductoVariante;
  product: Producto;
  inventory?: Inventario;
  brandName: string;
  sizeName: string;
  colorName: string;
};

interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectFieldProps<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

function SelectField<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={styles.selectText}>{selected?.label ?? 'Seleccionar'}</Text>
        <Ionicons name="chevron-down" size={16} color={PALETTE.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.selectOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.selectMenu}>
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[styles.selectOption, isSelected && styles.selectOptionSelected]}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      isSelected && styles.selectOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={PALETTE.active} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const STATUS_OPTIONS: SelectOption<boolean>[] = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' },
];

export default function ProductosScreen() {
  const {
    products,
    variants,
    inventory,
    addProduct,
    updateProduct,
    addVariant,
    updateVariant,
    setVariantInventory,
  } = useProducts();
  const {
    marcas,
    categorias,
    generos,
    tallas,
    colores,
    addMarca,
    addTalla,
    addColor,
  } = useCatalogs();
  const { user } = useAuth();
  const { log } = useActivity();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 700;

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editing, setEditing] = useState<EditingSnapshot | null>(null);
  const [search, setSearch] = useState('');
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'error', title: '', message: '' });

  const rows = useMemo(() => {
    const result: ProductRow[] = [];
    for (const variant of variants) {
      const product = products.find(item => item.id === variant.id_producto);
      if (!product) continue;
      result.push({
        variant,
        product,
        inventory: inventory.find(item => item.id_variante === variant.id),
        brandName:
          marcas.find(brand => brand.id === product.id_marca)?.nombre_marca ?? '',
        sizeName: tallas.find(size => size.id === variant.id_talla)?.numero_talla ?? '',
        colorName: colores.find(color => color.id === variant.id_color)?.nombre_color ?? '',
      });
    }
    return result;
  }, [variants, products, inventory, marcas, tallas, colores]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => {
      return (
        (row.variant.codigo_barras ?? '').toLowerCase().includes(query) ||
        row.product.nombre.toLowerCase().includes(query) ||
        row.brandName.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertState({ visible: true, type, title, message });
  };

  const resolveBrand = async (name: string) => {
    const normalized = name.trim().toLowerCase();
    const existing = marcas.find(
      brand => brand.nombre_marca.trim().toLowerCase() === normalized,
    );
    return existing ?? addMarca({ nombre_marca: name.trim(), estado: true });
  };

  const resolveSize = async (size: string) => {
    const value = size.trim();
    const existing = tallas.find(item => item.numero_talla === value);
    return existing ?? addTalla({ numero_talla: value });
  };

  const resolveColor = async (color: string) => {
    const normalized = color.trim().toLowerCase();
    const existing = colores.find(
      item => item.nombre_color.trim().toLowerCase() === normalized,
    );
    return existing ?? addColor({ nombre_color: color.trim() });
  };

  const handleClear = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (row: ProductRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing({ productId: row.product.id, variantId: row.variant.id });
    setForm({
      codigo: row.variant.codigo_barras ?? '',
      modelo: row.product.nombre,
      marca: row.brandName,
      talla: row.sizeName,
      color: row.colorName,
      precio_venta: row.variant.precio_venta.toFixed(2),
      stock_inicial: String(row.inventory?.stock_actual ?? 0),
      stock_minimo: String(row.inventory?.stock_minimo ?? 5),
      estado: row.product.estado,
    });
  };

  const handleSave = async () => {
    const code = form.codigo.trim();
    const model = form.modelo.trim();
    const brand = form.marca.trim();
    const size = form.talla.trim();
    const color = form.color.trim();

    if (!code || !model || !brand || !size || !color) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'error',
        'Datos incompletos',
        'Completa código, modelo, marca, talla y color.',
      );
      return;
    }

    if (!/^\d{1,3}$/.test(size)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Talla inválida', 'La talla debe ser un valor numérico.');
      return;
    }

    const price = Number(form.precio_venta.trim().replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Precio inválido', 'Ingresa un precio de venta mayor a 0.');
      return;
    }

    const stockActual = Number(form.stock_inicial.trim() || '0');
    const stockMinimo = Number(form.stock_minimo.trim() || '0');

    if (!Number.isInteger(stockActual) || stockActual < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Stock inválido', 'El stock inicial debe ser un número entero.');
      return;
    }

    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Stock inválido', 'El stock mínimo debe ser un número entero.');
      return;
    }

    const normalizedCode = code.toLowerCase();
    const duplicatedCode = variants.some(
      variant =>
        variant.id !== editing?.variantId &&
        (variant.codigo_barras ?? '').trim().toLowerCase() === normalizedCode,
    );

    if (duplicatedCode) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Código duplicado', 'Ese código ya está registrado.');
      return;
    }

    let brandEntity: Marca;
    let sizeEntity: Talla;
    let colorEntity: Color;

    try {
      brandEntity = await resolveBrand(brand);
      sizeEntity = await resolveSize(size);
      colorEntity = await resolveColor(color);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'error',
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Error al crear el catálogo.',
      );
      return;
    }

    try {
      if (editing) {
        const duplicatedVariant = variants.some(
          variant =>
            variant.id !== editing.variantId &&
            variant.id_producto === editing.productId &&
            variant.id_talla === sizeEntity.id &&
            variant.id_color === colorEntity.id,
        );

        if (duplicatedVariant) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showAlert(
            'error',
            'Variante duplicada',
            'Ese modelo ya tiene una variante con la misma talla y color.',
          );
          return;
        }

        await updateProduct(editing.productId, {
          nombre: model,
          id_marca: brandEntity.id,
          estado: form.estado,
        });
        await updateVariant(editing.variantId, {
          id_talla: sizeEntity.id,
          id_color: colorEntity.id,
          codigo_barras: code,
          precio_venta: price,
        });
        await setVariantInventory(editing.variantId, stockActual, stockMinimo);

        if (user?.employeeId) {
          log(user.employeeId, 'PRODUCT_UPDATED', `Producto "${model}" actualizado`);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert('success', 'Producto actualizado', 'Los cambios se guardaron correctamente.');
      } else {
        const existingProduct = products.find(
          product =>
            product.nombre.trim().toLowerCase() === model.toLowerCase() &&
            product.id_marca === brandEntity.id,
        );

        if (existingProduct) {
          const duplicatedVariant = variants.some(
            variant =>
              variant.id_producto === existingProduct.id &&
              variant.id_talla === sizeEntity.id &&
              variant.id_color === colorEntity.id,
          );

          if (duplicatedVariant) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(
              'error',
              'Variante duplicada',
              'Ese modelo ya tiene una variante con la misma talla y color.',
            );
            return;
          }

          if (existingProduct.estado !== form.estado) {
            await updateProduct(existingProduct.id, { estado: form.estado });
          }

          await addVariant(
            {
              id_producto: existingProduct.id,
              id_talla: sizeEntity.id,
              id_color: colorEntity.id,
              codigo_barras: code,
              precio_compra: 0,
              precio_venta: price,
            },
            stockActual,
            stockMinimo,
          );
        } else {
          const fallbackCategoria = categorias[0]?.id ?? 1;
          const fallbackGenero = (generos.find(genero => genero.estado) ?? generos[0])?.id ?? 1;
          const newProduct = await addProduct({
            id_marca: brandEntity.id,
            id_categoria: fallbackCategoria,
            id_genero: fallbackGenero,
            nombre: model,
            estado: form.estado,
          });

          await addVariant(
            {
              id_producto: newProduct.id,
              id_talla: sizeEntity.id,
              id_color: colorEntity.id,
              codigo_barras: code,
              precio_compra: 0,
              precio_venta: price,
            },
            stockActual,
            stockMinimo,
          );
        }

        if (user?.employeeId) {
          log(user.employeeId, 'PRODUCT_CREATED', `Producto "${model}" registrado`);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert('success', 'Producto creado', 'El producto se registró correctamente.');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'error',
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Error al guardar en Supabase.',
      );
      return;
    }

    handleClear();
  };

  return (
    <View style={styles.page}>
      <AdminTopNav active="Gestión" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            Registro de productos
          </Text>
          <Text style={styles.subtitle}>
            Cada modelo se registra por talla, con su precio y su stock mínimo.
          </Text>

          <ModuleTabs items={gestionTabs('productos')} />

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    {editing ? 'ETIQUETA · EDITAR PRODUCTO' : 'ETIQUETA · NUEVO PRODUCTO'}
                  </Text>
                </View>

                <View style={[styles.formBody, isMobile && styles.formBodyMobile]}>
                  <View>
                    <Text style={styles.label}>Código</Text>
                    <TextInput
                      style={styles.input}
                      value={form.codigo}
                      onChangeText={value => setForm(prev => ({ ...prev, codigo: value }))}
                      placeholder="Ej. ZAP-001"
                      placeholderTextColor={PALETTE.placeholder}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View style={styles.rowTwo}>
                    <View style={styles.rowHalf}>
                      <Text style={styles.label}>Modelo</Text>
                      <TextInput
                        style={styles.input}
                        value={form.modelo}
                        onChangeText={value => setForm(prev => ({ ...prev, modelo: value }))}
                        placeholder="Ej. Air Max 90"
                        placeholderTextColor={PALETTE.placeholder}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                    <View style={styles.rowHalf}>
                      <Text style={styles.label}>Marca</Text>
                      <TextInput
                        style={styles.input}
                        value={form.marca}
                        onChangeText={value => setForm(prev => ({ ...prev, marca: value }))}
                        placeholder="Ej. Nike"
                        placeholderTextColor={PALETTE.placeholder}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                  </View>

                  <View style={styles.rowTwo}>
                    <View style={styles.sizeHalf}>
                      <Text style={styles.label}>Talla</Text>
                      <TextInput
                        style={styles.input}
                        value={form.talla}
                        onChangeText={value => setForm(prev => ({ ...prev, talla: value }))}
                        placeholder="38"
                        placeholderTextColor={PALETTE.placeholder}
                        keyboardType="numeric"
                        maxLength={3}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                    <View style={styles.colorHalf}>
                      <Text style={styles.label}>Color</Text>
                      <TextInput
                        style={styles.input}
                        value={form.color}
                        onChangeText={value => setForm(prev => ({ ...prev, color: value }))}
                        placeholder="Ej. Negro"
                        placeholderTextColor={PALETTE.placeholder}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>Precio de venta (S/)</Text>
                    <TextInput
                      style={styles.input}
                      value={form.precio_venta}
                      onChangeText={value => setForm(prev => ({ ...prev, precio_venta: value }))}
                      placeholder="0.00"
                      placeholderTextColor={PALETTE.placeholder}
                      keyboardType="decimal-pad"
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <View style={styles.rowTwo}>
                      <View style={styles.rowHalf}>
                        <Text style={styles.label}>Stock inicial</Text>
                        <TextInput
                          style={styles.input}
                          value={form.stock_inicial}
                          onChangeText={value =>
                            setForm(prev => ({ ...prev, stock_inicial: value }))
                          }
                          placeholder="0"
                          placeholderTextColor={PALETTE.placeholder}
                          keyboardType="number-pad"
                          underlineColorAndroid="transparent"
                          selectionColor={PALETTE.active}
                        />
                      </View>
                      <View style={styles.rowHalf}>
                        <Text style={styles.label}>Stock mínimo</Text>
                        <TextInput
                          style={styles.input}
                          value={form.stock_minimo}
                          onChangeText={value =>
                            setForm(prev => ({ ...prev, stock_minimo: value }))
                          }
                          placeholder="5"
                          placeholderTextColor={PALETTE.placeholder}
                          keyboardType="number-pad"
                          underlineColorAndroid="transparent"
                          selectionColor={PALETTE.active}
                        />
                      </View>
                    </View>
                    <Text style={styles.helpText}>
                      Al llegar al mínimo, el sistema avisa que hay que reponer.
                    </Text>
                  </View>

                  <View>
                    <SelectField
                      label="Estado"
                      value={form.estado}
                      options={STATUS_OPTIONS}
                      onChange={value => setForm(prev => ({ ...prev, estado: value }))}
                    />
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveButtonText}>Guardar producto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={handleClear}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearButtonText}>LIMPIAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.tableColumn, isDesktop && styles.tableColumnDesktop]}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>HOJA · PRODUCTOS REGISTRADOS</Text>
                </View>

                <View style={[styles.tableBody, isMobile && styles.tableBodyMobile]}>
                  <View style={styles.searchField}>
                    <Text style={styles.label}>Buscar</Text>
                    <TextInput
                      style={styles.input}
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Código, modelo o marca"
                      placeholderTextColor={PALETTE.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.table}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colCodigo]}>Código</Text>
                        <Text style={[styles.th, styles.colModelo]}>Modelo</Text>
                        <Text style={[styles.th, styles.colMarca]}>Marca</Text>
                        <Text style={[styles.th, styles.colTalla, styles.thCenter]}>
                          Talla
                        </Text>
                        <Text style={[styles.th, styles.colPrecio]}>Precio</Text>
                        <Text style={[styles.th, styles.colStock]}>Stock</Text>
                        <Text style={[styles.th, styles.colEstado, styles.thCenter]}>
                          Estado
                        </Text>
                        <Text style={[styles.th, styles.colAcciones, styles.thCenter]}>
                          Acciones
                        </Text>
                      </View>

                      {filteredRows.length === 0 ? (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyText}>Sin productos registrados.</Text>
                        </View>
                      ) : (
                        filteredRows.map(row => {
                          const stock = row.inventory?.stock_actual ?? 0;
                          const minimum = row.inventory?.stock_minimo ?? 5;
                          const isLow = stock <= minimum;

                          return (
                            <View key={row.variant.id} style={styles.tr}>
                              <Text style={[styles.td, styles.colCodigo, styles.cellText]}>
                                {row.variant.codigo_barras || '—'}
                              </Text>
                              <Text
                                style={[styles.td, styles.colModelo, styles.modelText]}
                                numberOfLines={2}
                              >
                                {row.product.nombre}
                              </Text>
                              <Text
                                style={[styles.td, styles.colMarca, styles.cellText]}
                                numberOfLines={1}
                              >
                                {row.brandName || '—'}
                              </Text>

                              <View style={[styles.td, styles.colTalla, styles.tdCenter]}>
                                <View style={styles.sizeBadge}>
                                  <Text style={styles.sizeBadgeText}>
                                    {row.sizeName || '—'}
                                  </Text>
                                </View>
                              </View>

                              <Text style={[styles.td, styles.colPrecio, styles.cellText]}>
                                {`S/ ${row.variant.precio_venta.toFixed(2)}`}
                              </Text>

                              <View style={[styles.td, styles.colStock]}>
                                <View
                                  style={[
                                    styles.stockBadge,
                                    isLow ? styles.stockBadgeLow : styles.stockBadgeOk,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.stockBadgeText,
                                      isLow ? styles.stockTextLow : styles.stockTextOk,
                                    ]}
                                  >
                                    {`${stock} · ${isLow ? 'REPONER' : 'DISPONIBLE'}`}
                                  </Text>
                                </View>
                              </View>

                              <View style={[styles.td, styles.colEstado, styles.tdCenter]}>
                                <View
                                  style={[
                                    styles.statusPill,
                                    row.product.estado
                                      ? styles.statusActive
                                      : styles.statusInactive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,
                                      row.product.estado
                                        ? styles.statusTextActive
                                        : styles.statusTextInactive,
                                    ]}
                                  >
                                    {row.product.estado ? 'Activo' : 'Inactivo'}
                                  </Text>
                                </View>
                              </View>

                              <View style={[styles.td, styles.colAcciones, styles.tdCenter]}>
                                <TouchableOpacity
                                  style={styles.editButton}
                                  onPress={() => handleEdit(row)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.editButtonText}>Editar</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  </ScrollView>

                  <Text style={styles.tableFooter}>
                    {'El stock marcado como "reponer" llegó al mínimo configurado.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PALETTE.page,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
  },
  scrollContentMobile: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 1280,
  },
  title: {
    color: PALETTE.heading,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  columns: {
    flexDirection: 'column',
    gap: Spacing.xl,
  },
  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formColumn: {
    width: '100%',
  },
  formColumnDesktop: {
    width: 360,
    flexGrow: 0,
    flexShrink: 0,
  },
  tableColumn: {
    width: '100%',
  },
  tableColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    ...CARD_SHADOW,
  },
  cardHeader: {
    backgroundColor: PALETTE.cardHeader,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopLeftRadius: BorderRadius.md - 1,
    borderTopRightRadius: BorderRadius.md - 1,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.cardBorder,
  },
  cardHeaderText: {
    color: PALETTE.cardHeaderText,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.9,
  },
  formBody: {
    padding: Spacing.xl,
    gap: 14,
  },
  formBodyMobile: {
    padding: Spacing.lg,
  },
  label: {
    color: PALETTE.text,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    color: PALETTE.text,
    backgroundColor: PALETTE.card,
  },
  select: {
    height: 46,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.card,
    gap: Spacing.sm,
  },
  selectText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 43, 78, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  selectMenu: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    ...CARD_SHADOW,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  selectOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  selectOptionText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
  },
  selectOptionTextSelected: {
    color: PALETTE.active,
    fontWeight: FontWeight.semibold,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rowHalf: {
    flex: 1,
  },
  sizeHalf: {
    flex: 0.7,
  },
  colorHalf: {
    flex: 1.3,
  },
  helpText: {
    color: PALETTE.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    flex: 13,
    height: 50,
    backgroundColor: PALETTE.active,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: PALETTE.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  clearButton: {
    flex: 7,
    height: 50,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: PALETTE.text,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
  },
  tableBody: {
    padding: Spacing.xl,
  },
  tableBodyMobile: {
    padding: Spacing.lg,
  },
  searchField: {
    marginBottom: 14,
  },
  table: {
    width: '100%',
    minWidth: 740,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.tableHead,
    borderTopLeftRadius: BorderRadius.sm - 1,
    borderTopRightRadius: BorderRadius.sm - 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D5DCE6',
  },
  th: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  thCenter: {
    textAlign: 'center',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.rowBorder,
    backgroundColor: PALETTE.card,
  },
  td: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  tdCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
  },
  modelText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  colCodigo: {
    flex: 1.2,
  },
  colModelo: {
    flex: 2,
  },
  colMarca: {
    flex: 1.2,
  },
  colTalla: {
    flex: 0.6,
  },
  colPrecio: {
    flex: 0.9,
  },
  colStock: {
    flex: 1.4,
  },
  colEstado: {
    flex: 0.9,
  },
  colAcciones: {
    flex: 1,
  },
  sizeBadge: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: PALETTE.sizeBorder,
    backgroundColor: PALETTE.sizeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBadgeText: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockBadgeLow: {
    backgroundColor: PALETTE.stockLowBg,
  },
  stockBadgeOk: {
    backgroundColor: PALETTE.stockOkBg,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  stockTextLow: {
    color: PALETTE.stockLowText,
  },
  stockTextOk: {
    color: PALETTE.stockOkText,
  },
  statusPill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: PALETTE.statusActiveBg,
  },
  statusInactive: {
    backgroundColor: PALETTE.statusInactiveBg,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  statusTextActive: {
    color: PALETTE.statusActiveText,
  },
  statusTextInactive: {
    color: PALETTE.statusInactiveText,
  },
  editButton: {
    height: 34,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: PALETTE.textMuted,
    fontSize: FontSize.sm,
  },
  tableFooter: {
    color: PALETTE.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 14,
  },
});
