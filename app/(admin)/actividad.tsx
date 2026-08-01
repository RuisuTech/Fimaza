import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useActivity } from '@/context/ActivityContext';
import { useUsers } from '@/context/UsersContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { AuditoriaSesion, TipoAccion } from '@/types';

type FilterUser = 'all' | string;
type FilterTime = 'today' | 'week' | 'all';

const ACTION_CONFIG: Record<TipoAccion, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  LOGIN: { icon: 'log-in-outline', color: '#34C759', bgColor: '#E8F8ED' },
  LOGOUT: { icon: 'log-out-outline', color: '#FF9500', bgColor: '#FFF4E6' },
  STOCK_UPDATE: { icon: 'cube-outline', color: '#007AFF', bgColor: '#E6F2FF' },
  SALE_COMPLETED: { icon: 'cart-outline', color: '#AF52DE', bgColor: '#F3E8FA' },
  PRODUCT_CREATED: { icon: 'add-circle-outline', color: '#34C759', bgColor: '#E8F8ED' },
  PRODUCT_UPDATED: { icon: 'create-outline', color: '#007AFF', bgColor: '#E6F2FF' },
  PRODUCT_TOGGLED: { icon: 'toggle-outline', color: '#FF9500', bgColor: '#FFF4E6' },
  VARIANT_CREATED: { icon: 'layers-outline', color: '#34C759', bgColor: '#E8F8ED' },
  VARIANT_DELETED: { icon: 'trash-outline', color: '#FF3B30', bgColor: '#FFE6E6' },
  EMPLOYEE_CREATED: { icon: 'person-add-outline', color: '#34C759', bgColor: '#E8F8ED' },
  EMPLOYEE_UPDATED: { icon: 'person-outline', color: '#007AFF', bgColor: '#E6F2FF' },
  EMPLOYEE_TOGGLED: { icon: 'person-outline', color: '#FF9500', bgColor: '#FFF4E6' },
  SETTINGS_CHANGED: { icon: 'settings-outline', color: '#8E8E93', bgColor: '#F2F2F7' },
};

const ACTION_LABELS: Record<TipoAccion, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  STOCK_UPDATE: 'Stock Update',
  SALE_COMPLETED: 'Venta',
  PRODUCT_CREATED: 'Producto Creado',
  PRODUCT_UPDATED: 'Producto Editado',
  PRODUCT_TOGGLED: 'Producto Activado/Desactivado',
  VARIANT_CREATED: 'Variante Creada',
  VARIANT_DELETED: 'Variante Eliminada',
  EMPLOYEE_CREATED: 'Empleado Creado',
  EMPLOYEE_UPDATED: 'Empleado Editado',
  EMPLOYEE_TOGGLED: 'Empleado Activado/Desactivado',
  SETTINGS_CHANGED: 'Configuración Modificada',
};

export default function ActividadScreen() {
  const { activities } = useActivity();
  const { employees } = useUsers();
  const C = useThemeColors();
  const { t } = useTranslation();

  const [filterUser, setFilterUser] = useState<FilterUser>('all');
  const [filterTime, setFilterTime] = useState<FilterTime>('all');

  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.nombres} ${emp.apellidos}` : `Empleado #${id}`;
  };

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (filterUser !== 'all') {
      result = result.filter(a => a.id_empleado === parseInt(filterUser));
    }

    if (filterTime !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (filterTime === 'today') {
        result = result.filter(a => new Date(a.fecha) >= startOfDay);
      } else if (filterTime === 'week') {
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        result = result.filter(a => new Date(a.fecha) >= startOfWeek);
      }
    }

    return result.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [activities, filterUser, filterTime]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderActivity = ({ item }: { item: AuditoriaSesion }) => {
    const config = ACTION_CONFIG[item.tipo_accion] || ACTION_CONFIG.LOGIN;
    const label = ACTION_LABELS[item.tipo_accion] || item.tipo_accion;

    return (
      <View style={[styles.activityCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.activityIcon, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.activityInfo}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityType, { color: config.color }]}>{label}</Text>
            <Text style={[styles.activityDate, { color: C.textMuted }]}>{formatDate(item.fecha)}</Text>
          </View>
          <Text style={[styles.activityUser, { color: C.text }]}>{getEmployeeName(item.id_empleado)}</Text>
          <Text style={[styles.activityDetail, { color: C.textSecondary }]}>{item.detalle}</Text>
        </View>
      </View>
    );
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>{t('activity.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{filteredActivities.length} registros</Text>
        </View>

        <View style={styles.filters}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: C.textSecondary }]}>{t('activity.filterUser')}</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: filterUser === 'all' ? C.accent : C.surface, borderColor: filterUser === 'all' ? C.accent : C.border }]}
                onPress={() => { Haptics.selectionAsync(); setFilterUser('all'); }}
              >
                <Text style={[styles.filterChipText, { color: filterUser === 'all' ? '#fff' : C.text }]}>{t('activity.all')}</Text>
              </TouchableOpacity>
              {employees.map(emp => (
                <TouchableOpacity
                  key={emp.id}
                  style={[styles.filterChip, { backgroundColor: filterUser === emp.id.toString() ? C.accent : C.surface, borderColor: filterUser === emp.id.toString() ? C.accent : C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setFilterUser(emp.id.toString()); }}
                >
                  <Text style={[styles.filterChipText, { color: filterUser === emp.id.toString() ? '#fff' : C.text }]} numberOfLines={1}>
                    {emp.nombres.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: C.textSecondary }]}>{t('activity.filterTime')}</Text>
            <View style={styles.filterChips}>
              {([
                { key: 'today', label: t('activity.today') },
                { key: 'week', label: t('activity.week') },
                { key: 'all', label: t('activity.allTime') },
              ] as const).map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, { backgroundColor: filterTime === opt.key ? C.accent : C.surface, borderColor: filterTime === opt.key ? C.accent : C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setFilterTime(opt.key); }}
                >
                  <Text style={[styles.filterChipText, { color: filterTime === opt.key ? '#fff' : C.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={filteredActivities}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={renderActivity}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('activity.empty')}</Text>
              </View>
            }
          />
        </View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  filters: {
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  filterRow: { marginBottom: Spacing.md },
  filterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  filterChipText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  listContainer: { flex: 1, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  listContent: { padding: Spacing.sm },
  activityCard: {
    flexDirection: 'row', borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  activityIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg,
  },
  activityInfo: { flex: 1 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  activityType: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  activityDate: { fontSize: FontSize.sm },
  activityUser: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  activityDetail: { fontSize: FontSize.md, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
});
