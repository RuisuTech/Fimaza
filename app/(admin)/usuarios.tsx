import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LOGIN: 'log-in',
  LOGOUT: 'log-out',
  AGREGAR_PRODUCTO: 'add-circle',
  EDITAR_PRODUCTO: 'create',
  ELIMINAR_PRODUCTO: 'trash',
  VENTA: 'cart',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}

export default function UsuariosScreen() {
  const { users, updateUser, createUser, deleteUser } = useAuth();
  const { activities } = useActivity();
  const C = useThemeColors();
  const { t } = useTranslation();

  const ACTION_LABELS: Record<string, string> = {
    LOGIN: 'Inicio sesion',
    LOGOUT: 'Cerro sesion',
    AGREGAR_PRODUCTO: 'Agrego producto',
    EDITAR_PRODUCTO: 'Edito producto',
    ELIMINAR_PRODUCTO: 'Elimino producto',
    VENTA: 'Realizo venta',
  };

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: C.success,
    LOGOUT: C.textMuted,
    AGREGAR_PRODUCTO: C.accent,
    EDITAR_PRODUCTO: C.warning,
    ELIMINAR_PRODUCTO: C.danger,
    VENTA: C.success,
  };

  const [historyUser, setHistoryUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [alertState, setAlertState] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const historyActivities = activities.filter(a => a.userId === historyUser);
  const historyName = users.find(u => u.id === historyUser)?.name || '';

  const openEdit = (id: string, name: string, email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingUser(id);
    setEditName(name);
    setEditEmail(email);
    setEditPassword('');
  };

  const handleSave = () => {
    if (!editName.trim() || !editEmail.trim()) {
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Nombre y email son obligatorios' });
      return;
    }
    const updates: { name: string; email: string; password?: string } = {
      name: editName.trim(),
      email: editEmail.trim(),
    };
    if (editPassword.trim()) updates.password = editPassword.trim();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser(editingUser!, updates);
    setEditingUser(null);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: 'Todos los campos son obligatorios' });
      return;
    }
    const result = await createUser({ name: newName.trim(), email: newEmail.trim(), password: newPassword.trim() });
    if (!result.success) {
      setAlertState({ visible: true, type: 'error', title: t('common.error'), message: result.error || 'No se pudo crear' });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCreateModal(false);
    setNewName(''); setNewEmail(''); setNewPassword('');
    setAlertState({ visible: true, type: 'success', title: 'Listo', message: 'Colaborador creado correctamente' });
  };

  const confirmDelete = () => {
    if (deleteModal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      deleteUser(deleteModal.id);
      setDeleteModal(null);
    }
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>{t('users.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{users.length} {t('dashboard.registers')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: C.accent }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreateModal(true); }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('users.new')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: u }) => {
          const count = activities.filter(a => a.userId === u.id).length;
          return (
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: u.role === 'admin' ? C.accent : C.success }]}>
                  <Text style={styles.avatarText}>{u.name.charAt(0)}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: C.text }]}>{u.name}</Text>
                  <Text style={[styles.email, { color: C.textMuted }]}>{u.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: u.role === 'admin' ? C.accentLight : C.successLight }]}>
                  <Text style={[styles.roleText, { color: u.role === 'admin' ? C.accent : C.success }]}>
                    {u.role === 'admin' ? t('users.admin') : t('users.user')}
                  </Text>
                </View>
              </View>
              <View style={[styles.cardActions, { borderTopColor: C.divider }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(u.id, u.name, u.email)}>
                  <Ionicons name="create-outline" size={14} color={C.accent} />
                  <Text style={[styles.actionText, { color: C.accent }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setHistoryUser(u.id)}>
                  <Ionicons name="time-outline" size={14} color={C.textSecondary} />
                  <Text style={[styles.actionText, { color: C.textSecondary }]}>({count})</Text>
                </TouchableOpacity>
                {u.role !== 'admin' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteModal({ id: u.id, name: u.name })}>
                    <Ionicons name="trash-outline" size={14} color={C.danger} />
                    <Text style={[styles.actionText, { color: C.danger }]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      <Modal visible={!!editingUser} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={[styles.label, { color: C.text }]}>Nombre</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={editName} onChangeText={setEditName} placeholderTextColor={C.textMuted} />
              <Text style={[styles.label, { color: C.text }]}>Email</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={editEmail} onChangeText={setEditEmail} placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />
              <Text style={[styles.label, { color: C.text }]}>Nueva contrasena (opcional)</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={editPassword} onChangeText={setEditPassword} placeholder="Dejar vacio para no cambiar" placeholderTextColor={C.textMuted} secureTextEntry />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setEditingUser(null)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{t('settings.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!historyUser} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Historial de {historyName}</Text>
              <TouchableOpacity onPress={() => setHistoryUser(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={historyActivities}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.activityItem, { borderBottomColor: C.divider }]}>
                  <View style={[styles.activityDot, { backgroundColor: ACTION_COLORS[item.action] || C.textMuted }]}>
                    <Ionicons name={ACTION_ICONS[item.action] || 'ellipsis-horizontal'} size={12} color="#fff" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityAction, { color: C.text }]}>{ACTION_LABELS[item.action] || item.action}</Text>
                    <Text style={[styles.activityDetail, { color: C.textSecondary }]}>{item.detail}</Text>
                    <Text style={[styles.activityTime, { color: C.textMuted }]}>{formatTime(item.timestamp)}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: C.textMuted }]}>Sin actividad registrada</Text>}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Nuevo Colaborador</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={[styles.label, { color: C.text }]}>Nombre</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={newName} onChangeText={setNewName} placeholder="Nombre completo" placeholderTextColor={C.textMuted} />
              <Text style={[styles.label, { color: C.text }]}>Email</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={newEmail} onChangeText={setNewEmail} placeholder="correo@ejemplo.com" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />
              <Text style={[styles.label, { color: C.text }]}>Contrasena</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} value={newPassword} onChangeText={setNewPassword} placeholder="Contrasena" placeholderTextColor={C.textMuted} secureTextEntry />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal visible={!!deleteModal} type="warning" title="Eliminar usuario?" message={`Se eliminara a ${deleteModal?.name}`} onClose={() => setDeleteModal(null)} onConfirm={confirmDelete} showCancel confirmText={t('common.delete')} />
      <AlertModal visible={alertState.visible} type={alertState.type} title={alertState.title} message={alertState.message} onClose={() => setAlertState(prev => ({ ...prev, visible: false }))} />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  addButtonText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  email: { fontSize: FontSize.sm },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardActions: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md,
    paddingTop: Spacing.md, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
  },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, maxHeight: '90%', padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.sm, marginBottom: Spacing.xs },
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
  activityItem: {
    flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  activityDot: {
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  activityDetail: { fontSize: FontSize.sm, marginTop: 2 },
  activityTime: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  emptyText: { textAlign: 'center', padding: Spacing.xxxxl, fontSize: FontSize.md },
});
