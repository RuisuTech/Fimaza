import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import { useActivity, Activity } from '@/context/ActivityContext';
import { useAuth } from '@/context/AuthContext';
import { KPICard, ActivityItem } from '@/components/ui';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import { Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminDashboard() {
  const { products } = useProducts();
  const { sales, totalSales } = useSales();
  const { activities } = useActivity();
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const C = useThemeColors();
  const { t } = useTranslation();

  const kpiData = useMemo(() => {
    const lowStock = products.filter(p => p.quantity <= p.minStock);
    const today = new Date().toDateString();
    const salesToday = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

    return [
      {
        id: '1',
        title: t('dashboard.products'),
        value: products.length,
        icon: 'cube-outline' as const,
        color: C.accent,
        trend: lowStock.length > 0 ? { value: lowStock.length, isPositive: false } : undefined,
      },
      {
        id: '2',
        title: t('dashboard.units'),
        value: totalUnits.toLocaleString(),
        icon: 'layers-outline' as const,
        color: C.success,
      },
      {
        id: '3',
        title: t('dashboard.salesToday'),
        value: salesToday.length,
        icon: 'cart-outline' as const,
        color: C.warning,
      },
      {
        id: '4',
        title: t('dashboard.revenue'),
        value: `S/ ${totalSales.toFixed(0)}`,
        icon: 'cash-outline' as const,
        color: C.success,
      },
    ];
  }, [products, sales, totalSales, t, C]);

  const recentActivities = useMemo(() => activities.slice(0, 8), [activities]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleKPICardPress = useCallback((index: number) => {
    const routes = ['/(admin)', '/(admin)/productos', '/(admin)/ventas', '/(admin)/ventas'];
    router.push(routes[index] as any);
  }, [router]);

  const renderActivityItem = useCallback(({ item }: { item: Activity }) => (
    <ActivityItem activity={item} />
  ), []);

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, { color: C.text }]}>{t('dashboard.greeting')}, {user?.name?.split(' ')[0] || 'Admin'}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('dashboard.summary')}</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        {kpiData.map((item, index) => (
          <View key={item.id} style={styles.kpiWrapper}>
            <KPICard
              title={item.title}
              value={item.value}
              icon={item.icon}
              color={item.color}
              trend={item.trend}
              onPress={() => handleKPICardPress(index)}
            />
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>{t('dashboard.recentActivity')}</Text>
        <Text style={[styles.sectionCount, { color: C.textMuted }]}>{recentActivities.length} {t('dashboard.registers')}</Text>
      </View>
    </View>
  ), [kpiData, handleKPICardPress, recentActivities.length, user, t, C]);

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <FlatList
          data={recentActivities}
          renderItem={renderActivityItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  greetingRow: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  kpiWrapper: {
    width: '47.5%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionCount: {
    fontSize: FontSize.sm,
  },
});
