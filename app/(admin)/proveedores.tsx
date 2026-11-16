import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AdminTopNav from '@/components/AdminTopNav';
import AlertModal from '@/components/AlertModal';
import AdminSummaryChips from '@/components/AdminSummaryChips';
import ModuleTabs from '@/components/admin/ModuleTabs';
import { gestionTabs } from '@/constants/adminTabs';
import { useSuppliers } from '@/context/SuppliersContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { Proveedor } from '@/types';

const PALETTE = {
  page: '#f4f5f7',
  card: '#ffffff',
  cardBorder: '#D5DCE6',
  cardHeader: '#f8fafc',
  cardHeaderText: '#64748b',
  heading: '#0B2545',
  text: '#1f2937',
  textMuted: '#6b7280',
  inputBorder: '#d0d5dd',
  active: '#255bb3',
  white: '#ffffff',
  tableHead: '#eef4fb',
  rowBorder: '#eef2f7',
  avatarBg: '#eaf2ff',
  avatarText: '#1e3a8a',
};

const CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
  : Shadows.sm;

type FormData = {
  ruc: string;
  razon_social: string;
  telefono: string;
  direccion: string;
  email: string;
};

const EMPTY_FORM: FormData = {
  ruc: '',
  razon_social: '',
  telefono: '',
  direccion: '',
  email: '',
};

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'P';

export default function ProveedoresScreen() {
  const { suppliers, addSupplier, updateSupplier } = useSuppliers();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 700;

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingSupplier, setEditingSupplier] = useState<Proveedor | null>(null);
  const [search, setSearch] = useState('');
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'error', title: '', message: '' });

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter(supplier =>
      supplier.razon_social.toLowerCase().includes(query) ||
      supplier.ruc.includes(query) ||
      (supplier.telefono ?? '').toLowerCase().includes(query) ||
      (supplier.direccion ?? '').toLowerCase().includes(query) ||
      (supplier.email ?? '').toLowerCase().includes(query),
    );
  }, [suppliers, search]);

  const emailCount = useMemo(
    () => suppliers.filter(supplier => Boolean(supplier.email)).length,
    [suppliers],
  );

  const phoneCount = useMemo(
    () => suppliers.filter(supplier => Boolean(supplier.telefono)).length,
    [suppliers],
  );

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertState({ visible: true, type, title, message });
  };

  const handleClear = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (supplier: Proveedor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSupplier(supplier);
    setForm({
      ruc: supplier.ruc,
      razon_social: supplier.razon_social,
      telefono: supplier.telefono ?? '',
      direccion: supplier.direccion ?? '',
      email: supplier.email ?? '',
    });
  };

  const handleSave = async () => {
    const ruc = form.ruc.trim();
    const razonSocial = form.razon_social.trim();
    const telefono = form.telefono.trim();
    const direccion = form.direccion.trim();
    const email = form.email.trim().toLowerCase();

    if (!ruc || !razonSocial) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Datos incompletos', 'Ingresa el RUC y la razón social.');
      return;
    }

    if (!/^\d{11}$/.test(ruc)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'RUC inválido', 'El RUC debe tener exactamente 11 dígitos.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    const duplicated = suppliers.some(
      supplier =>
        supplier.ruc === ruc && (!editingSupplier || supplier.id !== editingSupplier.id),
    );

    if (duplicated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'RUC duplicado', 'Ese RUC ya está registrado.');
      return;
    }

    const payload = {
      ruc,
      razon_social: razonSocial,
      telefono: telefono || undefined,
      direccion: direccion || undefined,
      email: email || undefined,
    };

    if (editingSupplier) {
      const result = await updateSupplier(editingSupplier.id, payload);
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo actualizar', result.error || 'Error al actualizar.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Proveedor actualizado', 'Los cambios se guardaron correctamente.');
    } else {
      const result = await addSupplier(payload);
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo crear', result.error || 'Error al crear el proveedor.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Proveedor creado', 'El proveedor se registró correctamente.');
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
            Registro de proveedores
          </Text>
          <Text style={styles.subtitle}>
            Guarda a quién le compras y ten sus datos listos para cada compra.
          </Text>

          <ModuleTabs items={gestionTabs('proveedores')} />

          <AdminSummaryChips
            items={[
              { label: 'Total', value: suppliers.length },
              { label: 'Con correo', value: emailCount, tone: 'success' },
              { label: 'Con teléfono', value: phoneCount },
            ]}
          />

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    {editingSupplier ? 'FICHA · EDITAR PROVEEDOR' : 'FICHA · NUEVO PROVEEDOR'}
                  </Text>
                </View>

                <View style={[styles.formBody, isMobile && styles.formBodyMobile]}>
                  <View style={styles.rowTwo}>
                    <View style={styles.rowHalf}>
                      <Text style={styles.label}>RUC</Text>
                      <TextInput
                        style={styles.input}
                        value={form.ruc}
                        onChangeText={value => setForm(prev => ({ ...prev, ruc: value }))}
                        keyboardType="numeric"
                        maxLength={11}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                    <View style={styles.rowHalf}>
                      <Text style={styles.label}>Teléfono</Text>
                      <TextInput
                        style={styles.input}
                        value={form.telefono}
                        onChangeText={value => setForm(prev => ({ ...prev, telefono: value }))}
                        keyboardType="phone-pad"
                        maxLength={20}
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>Razón social</Text>
                    <TextInput
                      style={styles.input}
                      value={form.razon_social}
                      onChangeText={value =>
                        setForm(prev => ({ ...prev, razon_social: value }))
                      }
                      maxLength={150}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <Text style={styles.label}>Dirección</Text>
                    <TextInput
                      style={styles.input}
                      value={form.direccion}
                      onChangeText={value => setForm(prev => ({ ...prev, direccion: value }))}
                      maxLength={255}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <Text style={styles.label}>Correo</Text>
                    <TextInput
                      style={styles.input}
                      value={form.email}
                      onChangeText={value => setForm(prev => ({ ...prev, email: value }))}
                      placeholder="Para enviar órdenes de compra"
                      placeholderTextColor={PALETTE.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={100}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveButtonText}>
                        {editingSupplier ? 'Guardar cambios' : 'Guardar proveedor'}
                      </Text>
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
                  <Text style={styles.cardHeaderText}>HOJA · PROVEEDORES REGISTRADOS</Text>
                </View>

                <View style={[styles.tableBody, isMobile && styles.tableBodyMobile]}>
                  <View style={styles.searchField}>
                    <Text style={styles.label}>Buscar</Text>
                    <TextInput
                      style={styles.input}
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Razón social, RUC, teléfono o correo"
                      placeholderTextColor={PALETTE.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.table}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colProveedor]}>Proveedor</Text>
                        <Text style={[styles.th, styles.colRuc]}>RUC</Text>
                        <Text style={[styles.th, styles.colTelefono]}>Teléfono</Text>
                        <Text style={[styles.th, styles.colDireccion]}>Dirección</Text>
                        <Text style={[styles.th, styles.colCorreo]}>Correo</Text>
                        <Text style={[styles.th, styles.colAcciones, styles.thCenter]}>
                          Acciones
                        </Text>
                      </View>

                      {filteredSuppliers.length === 0 ? (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyText}>
                            {search.trim()
                              ? 'No se encontraron proveedores.'
                              : 'Sin proveedores registrados.'}
                          </Text>
                          {search.trim() ? (
                            <TouchableOpacity
                              style={styles.emptyAction}
                              onPress={() => setSearch('')}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.emptyActionText}>Limpiar búsqueda</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : (
                        filteredSuppliers.map(supplier => (
                          <View key={supplier.id} style={styles.tr}>
                            <View style={[styles.td, styles.colProveedor, styles.supplierCell]}>
                              <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                  {getInitial(supplier.razon_social)}
                                </Text>
                              </View>
                              <Text style={styles.supplierName} numberOfLines={2}>
                                {supplier.razon_social}
                              </Text>
                            </View>

                            <Text style={[styles.td, styles.colRuc, styles.cellText]}>
                              {supplier.ruc}
                            </Text>
                            <Text style={[styles.td, styles.colTelefono, styles.cellText]}>
                              {supplier.telefono || '—'}
                            </Text>
                            <Text
                              style={[styles.td, styles.colDireccion, styles.cellText]}
                              numberOfLines={1}
                            >
                              {supplier.direccion || '—'}
                            </Text>
                            <Text
                              style={[styles.td, styles.colCorreo, styles.cellText]}
                              numberOfLines={1}
                            >
                              {supplier.email || '—'}
                            </Text>

                            <View style={[styles.td, styles.colAcciones, styles.actionsCell]}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEdit(supplier)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.editButtonText}>Editar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
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
    maxWidth: 1200,
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
    fontSize: FontSize.md,
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
    flex: 2,
    width: 'auto',
    minWidth: 0,
  },
  tableColumn: {
    width: '100%',
  },
  tableColumnDesktop: {
    flex: 3,
    width: 'auto',
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
    borderBottomColor: PALETTE.rowBorder,
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
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rowHalf: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveButton: {
    flex: 7,
    height: 46,
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
    flex: 3,
    height: 46,
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
    letterSpacing: 0.5,
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
    minWidth: 800,
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
    borderBottomColor: PALETTE.cardBorder,
  },
  th: {
    color: '#334155',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
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
  cellText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
  },
  colProveedor: {
    flex: 2.4,
  },
  colRuc: {
    flex: 1.3,
  },
  colTelefono: {
    flex: 1.1,
  },
  colDireccion: {
    flex: 2,
  },
  colCorreo: {
    flex: 1.8,
  },
  colAcciones: {
    flex: 0.8,
  },
  supplierCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: PALETTE.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: PALETTE.avatarText,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  supplierName: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
  },
  actionsCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
  emptyAction: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: PALETTE.card,
  },
  emptyActionText: {
    color: PALETTE.active,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
});
