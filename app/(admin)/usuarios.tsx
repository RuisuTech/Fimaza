import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AdminTopNav from '@/components/AdminTopNav';
import AlertModal from '@/components/AlertModal';
import AdminSummaryChips from '@/components/AdminSummaryChips';
import ModuleTabs from '@/components/admin/ModuleTabs';
import { gestionTabs } from '@/constants/adminTabs';
import { useUsers } from '@/context/UsersContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { Empleado } from '@/types';

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
  dark: '#0B2545',
  white: '#ffffff',
  tableHead: '#eef4fb',
  rowBorder: '#eef2f7',
  badgeActiveBg: '#dcfce7',
  badgeActiveText: '#166534',
  badgeInactiveBg: '#f1f5f9',
  badgeInactiveText: '#64748b',
};

const CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
  : Shadows.sm;

type FormData = {
  fullName: string;
  dni: string;
  usuario: string;
  email: string;
  password: string;
  id_cargo: number;
  estado: boolean;
};

const EMPTY_FORM: FormData = {
  fullName: '',
  dni: '',
  usuario: '',
  email: '',
  password: '',
  id_cargo: 2,
  estado: true,
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { nombres: fullName.trim(), apellidos: '' };
  }
  return {
    nombres: parts.slice(0, -1).join(' '),
    apellidos: parts[parts.length - 1],
  };
};

const getCuenta = (employee: Empleado) =>
  employee.usuario || employee.email?.split('@')[0] || employee.documento_identidad;

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

export default function UsuariosScreen() {
  const {
    employees,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
    refresh,
  } = useUsers();
  const { cargos } = useCatalogs();
  const { user } = useAuth();
  const { log } = useActivity();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 700;

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
  }>({ visible: false, type: 'error', title: '', message: '' });

  const roleOptions = useMemo(
    () =>
      cargos
        .filter(cargo => cargo.estado)
        .map(cargo => ({
          value: cargo.id,
          label:
            cargo.id === 1
              ? 'Administrador'
              : cargo.id === 2
                ? 'Vendedora'
                : cargo.nombre_cargo,
        })),
    [cargos],
  );

  const statusOptions: SelectOption<boolean>[] = [
    { value: true, label: 'Activo' },
    { value: false, label: 'Inactivo' },
  ];

  const getRoleLabel = (idCargo: number) => {
    if (idCargo === 1) return 'Administrador';
    if (idCargo === 2) return 'Vendedora';
    return cargos.find(cargo => cargo.id === idCargo)?.nombre_cargo ?? 'Vendedora';
  };

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(employee => {
      const name = `${employee.nombres} ${employee.apellidos}`.toLowerCase();
      return (
        name.includes(query) ||
        employee.documento_identidad.includes(query) ||
        getCuenta(employee).toLowerCase().includes(query) ||
        (employee.email ?? '').toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  const activeCount = useMemo(
    () => employees.filter(employee => employee.estado).length,
    [employees],
  );

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: { onConfirm?: () => void; showCancel?: boolean; confirmText?: string },
  ) => {
    setAlertState({ visible: true, type, title, message, ...options });
  };

  const handleClear = () => {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  };

  const handleEdit = (employee: Empleado) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEmployee(employee);
    setForm({
      fullName: `${employee.nombres} ${employee.apellidos}`.trim(),
      dni: employee.documento_identidad,
      usuario: getCuenta(employee),
      email: employee.email ?? '',
      password: '',
      id_cargo: employee.id_cargo,
      estado: employee.estado,
    });
    setShowPassword(false);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.dni.trim() || !form.usuario.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Datos incompletos', 'Completa nombres, DNI y usuario.');
      return;
    }

    if (!/^\d{8}$/.test(form.dni.trim())) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'DNI inválido', 'El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    if (!editingEmployee && form.password.trim().length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'error',
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    if (editingEmployee && form.password.trim() && form.password.trim().length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'error',
        'Contraseña inválida',
        'La nueva contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    const usuario = form.usuario.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    const duplicated = employees.some(employee => {
      if (editingEmployee && employee.id === editingEmployee.id) return false;
      return (employee.usuario ?? employee.email?.split('@')[0] ?? '').toLowerCase() === usuario;
    });

    if (duplicated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Usuario duplicado', 'Ese nombre de usuario ya está registrado.');
      return;
    }

    const duplicatedEmail = email
      ? employees.some(
          employee =>
            employee.id !== editingEmployee?.id &&
            (employee.email ?? '').toLowerCase() === email,
        )
      : false;

    if (duplicatedEmail) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', 'Correo duplicado', 'Ese correo ya está registrado.');
      return;
    }

    const { nombres, apellidos } = splitFullName(form.fullName);

    if (editingEmployee) {
      const updates: Partial<Empleado> = {
        nombres,
        apellidos,
        documento_identidad: form.dni.trim(),
        usuario,
        email: email || undefined,
        id_cargo: form.id_cargo,
        estado: form.estado,
      };
      const result = await updateEmployee(
        editingEmployee.id,
        updates,
        form.password.trim() || undefined,
      );
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo actualizar', result.error || 'Error al guardar.');
        return;
      }
      if (user?.employeeId) {
        log(
          user.employeeId,
          'EMPLOYEE_UPDATED',
          `Empleado "${form.fullName.trim()}" actualizado`,
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Usuario actualizado', 'Los cambios se guardaron correctamente.');
    } else {
      const result = await addEmployee({
        id_cargo: form.id_cargo,
        nombres,
        apellidos,
        documento_identidad: form.dni.trim(),
        usuario,
        email: email || undefined,
        password: form.password,
        estado: form.estado,
      });

      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('error', 'No se pudo crear', result.error || 'Error al crear el usuario.');
        return;
      }

      if (user?.employeeId) {
        log(
          user.employeeId,
          'EMPLOYEE_CREATED',
          `Empleado "${form.fullName.trim()}" creado`,
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', 'Usuario creado', 'El usuario se registró correctamente.');
    }

    handleClear();
  };

  const handleToggleStatus = (employee: Empleado) => {
    if (employee.id === user?.employeeId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'warning',
        'Acción no permitida',
        'No puedes desactivar tu propio usuario mientras tienes la sesión activa.',
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willDeactivate = employee.estado;

    showAlert(
      'warning',
      willDeactivate ? 'Desactivar usuario' : 'Activar usuario',
      willDeactivate
        ? `"${employee.nombres} ${employee.apellidos}" no podrá iniciar sesión. ¿Continuar?`
        : `"${employee.nombres} ${employee.apellidos}" podrá iniciar sesión nuevamente. ¿Continuar?`,
      {
        showCancel: true,
        confirmText: willDeactivate ? 'Desactivar' : 'Activar',
        onConfirm: async () => {
          const result = await toggleEmployeeStatus(employee.id);
          if (!result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(
              'error',
              'No se pudo cambiar',
              result.error || 'Error al actualizar el estado.',
            );
            return;
          }
          if (user?.employeeId) {
            log(
              user.employeeId,
              'EMPLOYEE_TOGGLED',
              `Empleado "${employee.nombres} ${employee.apellidos}" ${
                willDeactivate ? 'desactivado' : 'activado'
              }`,
            );
          }
          setAlertState(prev => ({ ...prev, visible: false, onConfirm: undefined }));
        },
      },
    );
  };

  const handleDeleteEmployee = (employee: Empleado) => {
    if (employee.id === user?.employeeId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        'warning',
        'Acción no permitida',
        'No puedes eliminar tu propio usuario mientras tienes la sesión activa.',
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(
      'warning',
      'Eliminar usuario',
      `Se eliminarán el acceso y el perfil de "${employee.nombres} ${employee.apellidos}". Esta acción no se puede deshacer.`,
      {
        showCancel: true,
        confirmText: 'Eliminar',
        onConfirm: async () => {
          const result = await deleteEmployee(employee.id);
          if (!result.success) {
            showAlert('error', 'No se pudo eliminar', result.error || 'Error al eliminar.');
            return;
          }
          if (user?.employeeId) {
            log(
              user.employeeId,
              'EMPLOYEE_DELETED',
              `Empleado "${employee.nombres} ${employee.apellidos}" eliminado`,
            );
          }
          setAlertState(prev => ({ ...prev, visible: false, onConfirm: undefined }));
        },
      },
    );
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
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Registro de usuarios</Text>
          <Text style={styles.subtitle}>
            Solo el Administrador puede crear, modificar y desactivar usuarios.
          </Text>

          <ModuleTabs items={gestionTabs('usuarios')} />

          <AdminSummaryChips
            items={[
              { label: 'Total', value: employees.length },
              { label: 'Activos', value: activeCount, tone: 'success' },
              {
                label: 'Inactivos',
                value: employees.length - activeCount,
                tone: 'muted',
              },
            ]}
          />

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    {editingEmployee ? 'FICHA · EDITAR USUARIO' : 'FICHA · NUEVO USUARIO'}
                  </Text>
                </View>

                <View style={[styles.formBody, isMobile && styles.formBodyMobile]}>
                  <Text style={styles.helpText}>
                    El acceso se gestiona con Supabase Auth. Aquí administras perfiles, roles y estado.
                    Para crear credenciales nuevas, usa el dashboard de Supabase.
                  </Text>

                  <View>
                    <Text style={styles.label}>Nombres y apellidos</Text>
                    <TextInput
                      style={styles.input}
                      value={form.fullName}
                      onChangeText={value => setForm(prev => ({ ...prev, fullName: value }))}
                      placeholder="Ej. María José Pérez"
                      placeholderTextColor={PALETTE.textMuted}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <Text style={styles.label}>DNI</Text>
                    <TextInput
                      style={styles.input}
                      value={form.dni}
                      onChangeText={value => setForm(prev => ({ ...prev, dni: value }))}
                      placeholder="8 dígitos"
                      placeholderTextColor={PALETTE.textMuted}
                      keyboardType="numeric"
                      maxLength={8}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <Text style={styles.label}>Usuario</Text>
                    <TextInput
                      style={styles.input}
                      value={form.usuario}
                      onChangeText={value => setForm(prev => ({ ...prev, usuario: value }))}
                      placeholder="vendedora01"
                      placeholderTextColor={PALETTE.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                  </View>

                  <View>
                    <Text style={styles.label}>Correo (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      value={form.email}
                      onChangeText={value => setForm(prev => ({ ...prev, email: value }))}
                      placeholder="usuario@fimaza.com"
                      placeholderTextColor={PALETTE.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={100}
                      editable={!editingEmployee}
                      underlineColorAndroid="transparent"
                      selectionColor={PALETTE.active}
                    />
                    <Text style={styles.helpText}>
                      {editingEmployee
                        ? 'El correo de acceso se cambia desde Supabase Auth.'
                        : 'También se usará para iniciar sesión.'}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.label}>
                      {editingEmployee ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                    </Text>
                      <View style={styles.passwordRow}>
                        <TextInput
                          style={[styles.input, styles.passwordInput]}
                          value={form.password}
                          onChangeText={value => setForm(prev => ({ ...prev, password: value }))}
                          placeholder="Mínimo 8 caracteres"
                          placeholderTextColor={PALETTE.textMuted}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          underlineColorAndroid="transparent"
                          selectionColor={PALETTE.active}
                        />
                        <TouchableOpacity
                          style={styles.revealButton}
                          onPress={() => setShowPassword(value => !value)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                          }
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={PALETTE.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    <Text style={styles.helpText}>
                      {editingEmployee
                        ? 'Se actualizará en Supabase Auth mediante admin-update-employee.'
                        : 'Se crea en Supabase Auth mediante admin-create-employee.'}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.label}>Rol</Text>
                    <View style={styles.roleOptions}>
                      {roleOptions.map(option => {
                        const isActive = form.id_cargo === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[styles.roleOption, isActive && styles.roleOptionActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setForm(prev => ({ ...prev, id_cargo: option.value }));
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.roleOptionText,
                                isActive && styles.roleOptionTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <SelectField
                    label="Estado"
                    value={form.estado}
                    options={statusOptions}
                    onChange={value => setForm(prev => ({ ...prev, estado: value }))}
                  />

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveButtonText}>Guardar usuario</Text>
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
                  <Text style={styles.cardHeaderText}>HOJA · USUARIOS REGISTRADOS</Text>
                </View>

                <View style={[styles.tableBody, isMobile && styles.tableBodyMobile]}>
                  <View style={styles.searchField}>
                    <Text style={styles.label}>Buscar</Text>
                    <TextInput
                      style={styles.input}
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Nombre, DNI, usuario o correo"
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
                        <Text style={[styles.th, styles.colUser]}>Usuario</Text>
                        <Text style={[styles.th, styles.colDni]}>DNI</Text>
                        <Text style={[styles.th, styles.colCuenta]}>Cuenta</Text>
                        <Text style={[styles.th, styles.colRol]}>Rol</Text>
                        <Text style={[styles.th, styles.colEstado]}>Estado</Text>
                        <Text style={[styles.th, styles.colAcciones]}>Acciones</Text>
                      </View>

                      {filteredEmployees.length === 0 ? (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyText}>
                            {search.trim()
                              ? 'No se encontraron usuarios.'
                              : 'Sin usuarios registrados.'}
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
                        filteredEmployees.map(employee => (
                          <View key={employee.id} style={styles.tr}>
                            <View style={[styles.td, styles.colUser, styles.userCell]}>
                              <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                  {employee.nombres.charAt(0).toUpperCase() || 'N'}
                                </Text>
                              </View>
                              <Text style={styles.userName} numberOfLines={1}>
                                {`${employee.nombres} ${employee.apellidos}`.trim()}
                              </Text>
                            </View>

                            <Text style={[styles.td, styles.colDni, styles.cellText]}>
                              {employee.documento_identidad}
                            </Text>
                            <View style={[styles.td, styles.colCuenta]}>
                              <Text style={styles.cellText} numberOfLines={1}>
                                {getCuenta(employee)}
                              </Text>
                              {employee.email ? (
                                <Text style={styles.cellSubtext} numberOfLines={1}>
                                  {employee.email}
                                </Text>
                              ) : null}
                            </View>
                            <Text style={[styles.td, styles.colRol, styles.cellText]} numberOfLines={1}>
                              {getRoleLabel(employee.id_cargo)}
                            </Text>

                            <View style={[styles.td, styles.colEstado]}>
                              <View
                                style={[
                                  styles.badge,
                                  employee.estado ? styles.badgeActive : styles.badgeInactive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.badgeText,
                                    employee.estado
                                      ? styles.badgeTextActive
                                      : styles.badgeTextInactive,
                                  ]}
                                >
                                  {employee.estado ? 'Activo' : 'Inactivo'}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.td, styles.colAcciones, styles.actionsCell]}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEdit(employee)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.editButtonText}>Editar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.statusButton,
                                  employee.estado
                                    ? styles.statusButtonDanger
                                    : styles.statusButtonSuccess,
                                ]}
                                onPress={() => handleToggleStatus(employee)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.statusButtonText}>
                                  {employee.estado ? 'Desactivar' : 'Activar'}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteEmployee(employee)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.deleteButtonText}>Eliminar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  <Text style={styles.tableFooter}>
                    Puedes desactivar o eliminar usuarios. Un usuario inactivo no puede iniciar
                    sesión.
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
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        onClose={() =>
          setAlertState(prev => ({ ...prev, visible: false, onConfirm: undefined }))
        }
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
  },
  revealButton: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.card,
  },
  helpText: {
    color: PALETTE.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
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
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: PALETTE.card,
  },
  roleOptionActive: {
    borderColor: PALETTE.active,
    backgroundColor: PALETTE.active,
  },
  roleOptionText: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  roleOptionTextActive: {
    color: PALETTE.white,
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
    minWidth: 660,
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
  cellSubtext: {
    color: PALETTE.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  colUser: {
    flex: 2.3,
  },
  colDni: {
    flex: 0.9,
  },
  colCuenta: {
    flex: 1.2,
  },
  colRol: {
    flex: 1.1,
  },
  colEstado: {
    flex: 0.9,
  },
  colAcciones: {
    flex: 2,
  },
  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#374151',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  userName: {
    color: PALETTE.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeActive: {
    backgroundColor: PALETTE.badgeActiveBg,
  },
  badgeInactive: {
    backgroundColor: PALETTE.badgeInactiveBg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  badgeTextActive: {
    color: PALETTE.badgeActiveText,
  },
  badgeTextInactive: {
    color: PALETTE.badgeInactiveText,
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  statusButton: {
    backgroundColor: PALETTE.dark,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusButtonDanger: {
    backgroundColor: '#b91c1c',
  },
  statusButtonSuccess: {
    backgroundColor: '#047857',
  },
  statusButtonText: {
    color: PALETTE.white,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteButtonText: {
    color: '#b91c1c',
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
  tableFooter: {
    color: PALETTE.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 14,
  },
});
