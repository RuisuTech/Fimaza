import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUsers } from '@/context/UsersContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { Empleado } from '@/types';

type FormData = {
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  email: string;
  password_hash: string;
  id_cargo: number;
};

const EMPTY_FORM: FormData = { nombres: '', apellidos: '', documento_identidad: '', email: '', password_hash: '', id_cargo: 2 };

export default function UsuariosScreen() {
  const { employees, addEmployee, updateEmployee, toggleEmployeeStatus } = useUsers();
  const { cargos } = useCatalogs();
  const { user } = useAuth();
  const { log } = useActivity();
  const C = useThemeColors();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string; onConfirm?: () => void }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const getCargoName = (id: number) => cargos.find(c => c.id === id)?.nombre_cargo || '';

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (emp: Empleado) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEmployee(emp);
    setForm({
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      documento_identidad: emp.documento_identidad,
      email: emp.email || '',
      password_hash: '',
      id_cargo: emp.id_cargo,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.documento_identidad.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Nombres, apellidos y documento son obligatorios' });
      return;
    }
    if (!editingEmployee && !form.password_hash.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'La contrasena es obligatoria' });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingEmployee) {
      const updates: Partial<Empleado> = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        documento_identidad: form.documento_identidad.trim(),
        email: form.email.trim() || undefined,
        id_cargo: form.id_cargo,
      };
      if (form.password_hash.trim()) {
        updates.password_hash = form.password_hash.trim();
      }
      updateEmployee(editingEmployee.id, updates);
      if (user) log(user.employeeId!, 'EMPLOYEE_UPDATED', `Empleado "${form.nombres} ${form.apellidos}" editado`);
    } else {
      const result = await addEmployee({
        id_cargo: form.id_cargo,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        documento_identidad: form.documento_identidad.trim(),
        email: form.email.trim() || undefined,
        password_hash: form.password_hash.trim(),
        estado: true,
      });
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setAlertState({ visible: true, type: 'error', title: t('common.error'), message: result.error || 'Error al crear' });
        return;
      }
      if (user) log(user.employeeId!, 'EMPLOYEE_CREATED', `Empleado "${form.nombres} ${form.apellidos}" creado`);
    }
    setModalVisible(false);
    setForm(EMPTY_FORM);
    setEditingEmployee(null);
  };

  const handleToggleStatus = (emp: Empleado) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleEmployeeStatus(emp.id);
    if (user) log(user.employeeId!, 'EMPLOYEE_TOGGLED', `Empleado "${emp.nombres} ${emp.apellidos}" ${emp.estado ? 'desactivado' : 'activado'}`);
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.text }]}>{t('users.title')}</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>{employees.length} {t('dashboard.registers')}</Text>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: C.accent }]} onPress={openCreate} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>{t('users.new')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={employees}
            keyExtractor={emp => emp.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={({ item: emp }) => (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: emp.estado ? (emp.id_cargo === 1 ? C.accent : C.success) : C.textMuted }]}>
                <Text style={styles.avatarText}>{emp.nombres.charAt(0)}{emp.apellidos.charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: C.text }]}>{emp.nombres} {emp.apellidos}</Text>
                <Text style={[styles.email, { color: C.textMuted }]}>{emp.email || emp.documento_identidad}</Text>
              </View>
              <View style={styles.badges}>
                <View style={[styles.roleBadge, { backgroundColor: emp.id_cargo === 1 ? C.accentLight : C.successLight }]}>
                  <Text style={[styles.roleText, { color: emp.id_cargo === 1 ? C.accent : C.success }]}>
                    {getCargoName(emp.id_cargo)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: emp.estado ? C.successLight : C.dangerLight }]}>
                  <Text style={[styles.statusText, { color: emp.estado ? C.success : C.danger }]}>
                    {emp.estado ? t('users.active') : t('users.inactive')}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.cardActions, { borderTopColor: C.divider }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(emp)}>
                <Ionicons name="create-outline" size={14} color={C.accent} />
                <Text style={[styles.actionText, { color: C.accent }]}>{t('common.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(emp)}>
                <Ionicons name={emp.estado ? 'close-circle-outline' : 'checkmark-circle-outline'} size={14} color={emp.estado ? C.danger : C.success} />
                <Text style={[styles.actionText, { color: emp.estado ? C.danger : C.success }]}>
                  {emp.estado ? 'Desactivar' : 'Activar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('users.title')}: 0</Text>
          </View>
        }
      />
        </View>
      </View>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{editingEmployee ? t('common.edit') : t('users.new')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <Text style={[styles.label, { color: C.textSecondary }]}>{t('inventory.employee')} *</Text>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.nombres} onChangeText={v => setForm(p => ({ ...p, nombres: v }))} placeholder="Nombres" placeholderTextColor={C.textMuted} />
                  </View>
                  <View style={styles.half}>
                    <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.apellidos} onChangeText={v => setForm(p => ({ ...p, apellidos: v }))} placeholder="Apellidos" placeholderTextColor={C.textMuted} />
                  </View>
                </View>

                <Text style={[styles.label, { color: C.textSecondary }]}>Documento *</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.documento_identidad} onChangeText={v => setForm(p => ({ ...p, documento_identidad: v }))} placeholder="DNI / CE" placeholderTextColor={C.textMuted} keyboardType="numeric" />

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('login.email')}</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="correo@ejemplo.com" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />

                <Text style={[styles.label, { color: C.textSecondary }]}>{t('login.password')} {editingEmployee ? '(dejar vacio para no cambiar)' : '*'}</Text>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={form.password_hash} onChangeText={v => setForm(p => ({ ...p, password_hash: v }))} placeholder="Contrasena" placeholderTextColor={C.textMuted} secureTextEntry />

                <Text style={[styles.label, { color: C.textSecondary }]}>Cargo *</Text>
                <View style={styles.pickerRow}>
                  {cargos.filter(c => c.estado).map(c => (
                    <TouchableOpacity key={c.id} style={[styles.pickerChip, { backgroundColor: form.id_cargo === c.id ? C.accent : C.surface, borderColor: form.id_cargo === c.id ? C.accent : C.border }]} onPress={() => setForm(p => ({ ...p, id_cargo: c.id }))}>
                      <Text style={[styles.pickerText, { color: form.id_cargo === c.id ? '#fff' : C.text }]}>{c.nombre_cargo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingEmployee ? t('common.edit') : t('common.save')}</Text>
              </TouchableOpacity>
            </View>
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
  listContainer: { flex: 1, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  listContent: { padding: Spacing.sm },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  info: { flex: 1 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  email: { fontSize: FontSize.md },
  badges: { gap: Spacing.sm, alignItems: 'flex-end' },
  roleBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  roleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  cardActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  actionText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '90%', maxWidth: 440, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.sm },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.lg, minHeight: 44 },
  row: { flexDirection: 'row', gap: Spacing.lg },
  half: { flex: 1 },
  pickerRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  pickerChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  pickerText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  cancelBtnText: { fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
  saveBtn: { flex: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.lg },
});
