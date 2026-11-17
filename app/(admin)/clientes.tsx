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
import AdminSummaryChips from '@/components/AdminSummaryChips';
import ModuleTabs from '@/components/admin/ModuleTabs';
import { gestionTabs } from '@/constants/adminTabs';
import { useClients } from '@/context/ClientsContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { Cliente } from '@/types';

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
  tipo_documento: string;
  numero_documento: string;
  nombres_razon_social: string;
  telefono: string;
  correo: string;
};

const EMPTY_FORM: FormData = {
  tipo_documento: 'DNI',
  numero_documento: '',
  nombres_razon_social: '',
  telefono: '',
  correo: '',
};

const DOCUMENT_OPTIONS = [
  { label: 'DNI', value: 'DNI' },
  { label: 'RUC', value: 'RUC' },
  { label: 'CE', value: 'CE' },
];

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'C';

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

export default function ClientesScreen() {
  const { clients, addClient, updateClient } = useClients();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 700;

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [search, setSearch] = useState('');
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'error', title: '', message: '' });

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(client => {
      const document = `${client.tipo_documento} ${client.numero_documento}`.toLowerCase();
      return (
        client.nombres_razon_social.toLowerCase().includes(query) ||
        document.includes(query) ||
        (client.telefono ?? '').includes(query) ||
        (client.correo ?? '').toLowerCase().includes(query)
      );
    });
  }, [clients, search]);

  const companyCount = useMemo(
    () => clients.filter(client => client.tipo_documento === 'RUC').length,
    [clients],
  );

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertState({ visible: true, type, title, message });
  };

  const handleClear = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (client: Cliente) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingClient(client);
    setForm({
      tipo_documento: client.tipo_documento,
      numero_documento: client.numero_documento,
      nombres_razon_social: client.nombres_razon_social,
      telefono: client.telefono ?? '',
      correo: client.correo ?? '',
    });
  };

  const handleSave = async () => {
    const documentNumber = form.numero_documento.trim();
    const name = form.nombres_razon_social.trim();

    if (!documentNumber || !name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Datos incompletos', 'Ingresa el documento y los nombres o razón social.');
      return;
    }

    if (form.tipo_documento === 'DNI' && !/^\d{8}$/.test(documentNumber)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'DNI inválido', 'El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    if (form.tipo_documento === 'RUC' && !/^\d{11}$/.test(documentNumber)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'RUC inválido', 'El RUC debe tener exactamente 11 dígitos.');
      return;
    }

    const email = form.correo.trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    const duplicated = clients.some(
      client =>
        client.tipo_documento === form.tipo_documento &&
        client.numero_documento === documentNumber &&
        (!editingClient || client.id !== editingClient.id),
    );

    if (duplicated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Documento duplicado', 'Ese documento ya está registrado.');
      return;
    }

    const payload = {
      tipo_documento: form.tipo_documento,
      numero_documento: documentNumber,
      nombres_razon_social: name,
      telefono: form.telefono.trim() || undefined,
      correo: email || undefined,
    };

    if (editingClient) {
      const result = await updateClient(editingClient.id, payload);
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo actualizar', result.error || 'Error al guardar el cliente.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Cliente actualizado', 'Los cambios se guardaron correctamente.');
    } else {
      const result = await addClient(payload);
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo crear', result.error || 'Error al crear el cliente.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Cliente creado', 'El cliente se registró correctamente.');
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
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Registro de clientes</Text>
          <Text style={styles.subtitle}>
            Registra al cliente una sola vez y úsalo en cada venta y boleta.
          </Text>

          <ModuleTabs items={gestionTabs('clientes')} />

          <AdminSummaryChips
            items={[
              { label: 'Total', value: clients.length },
              { label: 'Personas', value: clients.length - companyCount },
              { label: 'Empresas', value: companyCount, tone: 'success' },
            ]}
          />

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    {editingClient ? 'FICHA · EDITAR CLIENTE' : 'FICHA · NUEVO CLIENTE'}
                  </Text>
                </View>

                <View style={[styles.formBody, isMobile && styles.formBodyMobile]}>
                  <View style={styles.rowTwo}>
                    <View style={styles.rowHalf}>
                      <SelectField
                        label="Documento"
                        value={form.tipo_documento}
                        options={DOCUMENT_OPTIONS}
                        onChange={value => setForm(prev => ({ ...prev, tipo_documento: value }))}
                      />
                    </View>
                    <View style={styles.rowHalf}>
                      <Text style={styles.label}>N° de documento</Text>
                      <TextInput
                        style={styles.input}
                        value={form.numero_documento}
                        onChangeText={value =>
                          setForm(prev => ({ ...prev, numero_documento: value }))
                        }
                        keyboardType={form.tipo_documento === 'CE' ? 'default' : 'numeric'}
                        maxLength={
                          form.tipo_documento === 'RUC'
                            ? 11
                            : form.tipo_documento === 'DNI'
                              ? 8
                              : 12
                        }
                        underlineColorAndroid="transparent"
                        selectionColor={PALETTE.active}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>Nombres o razón social</Text>
                    <TextInput
                      style={styles.input}
                      value={form.nombres_razon_social}
                      onChangeText={value =>
                        setForm(prev => ({ ...prev, nombres_razon_social: value }))
                      }
                      maxLength={150}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
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

                  <View>
                    <Text style={styles.label}>Correo</Text>
                    <TextInput
                      style={styles.input}
                      value={form.correo}
                      onChangeText={value => setForm(prev => ({ ...prev, correo: value }))}
                      placeholder="Para enviar la boleta electrónica"
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
                        {editingClient ? 'Guardar cambios' : 'Guardar cliente'}
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
                  <Text style={styles.cardHeaderText}>HOJA · CLIENTES REGISTRADOS</Text>
                </View>

                <View style={[styles.tableBody, isMobile && styles.tableBodyMobile]}>
                  <View style={styles.searchField}>
                    <Text style={styles.label}>Buscar</Text>
                    <TextInput
                      style={styles.input}
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Nombre, documento o correo"
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
                        <Text style={[styles.th, styles.colCliente]}>Cliente</Text>
                        <Text style={[styles.th, styles.colDocumento]}>Documento</Text>
                        <Text style={[styles.th, styles.colTelefono]}>Teléfono</Text>
                        <Text style={[styles.th, styles.colCorreo]}>Correo</Text>
                        <Text style={[styles.th, styles.colAcciones, styles.thCenter]}>
                          Acciones
                        </Text>
                      </View>

                      {filteredClients.length === 0 ? (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyText}>
                            {search.trim()
                              ? 'No se encontraron clientes.'
                              : 'Sin clientes registrados.'}
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
                        filteredClients.map(client => (
                          <View key={client.id} style={styles.tr}>
                            <View style={[styles.td, styles.colCliente, styles.clientCell]}>
                              <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                  {getInitial(client.nombres_razon_social)}
                                </Text>
                              </View>
                              <Text style={styles.clientName} numberOfLines={2}>
                                {client.nombres_razon_social}
                              </Text>
                            </View>

                            <Text style={[styles.td, styles.colDocumento, styles.cellText]}>
                              {`${client.tipo_documento} ${client.numero_documento}`}
                            </Text>
                            <Text style={[styles.td, styles.colTelefono, styles.cellText]}>
                              {client.telefono || '—'}
                            </Text>
                            <Text
                              style={[styles.td, styles.colCorreo, styles.cellText]}
                              numberOfLines={1}
                            >
                              {client.correo || '—'}
                            </Text>

                            <View style={[styles.td, styles.colAcciones, styles.actionsCell]}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEdit(client)}
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
    minWidth: 680,
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
  colCliente: {
    flex: 2.4,
  },
  colDocumento: {
    flex: 1.4,
  },
  colTelefono: {
    flex: 1,
  },
  colCorreo: {
    flex: 1.6,
  },
  colAcciones: {
    flex: 0.8,
  },
  clientCell: {
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
  clientName: {
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
