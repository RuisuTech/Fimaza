import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import DashboardLayout from '@/components/DashboardLayout';
import { collaboratorNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function CollaboratorDashboard() {
  const { inventory, variants } = useProducts();
  const { sales, getTodaySales } = useSales();
  const C = useThemeColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const stats = useMemo(() => {
    const todaySales = getTodaySales();
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_venta, 0);
    const todayProfit = todaySales.reduce((sum, sale) => {
      return sum + (sale.detalles || []).reduce((dSum, d) => {
        const v = variants.find(va => va.id === d.id_variante);
        const pc = v?.precio_compra || 0;
        return dSum + ((d.precio_unitario - pc) * d.cantidad);
      }, 0);
    }, 0);
    const totalProfit = sales.reduce((sum, sale) => {
      return sum + (sale.detalles || []).reduce((dSum, d) => {
        const v = variants.find(va => va.id === d.id_variante);
        const pc = v?.precio_compra || 0;
        return dSum + ((d.precio_unitario - pc) * d.cantidad);
      }, 0);
    }, 0);
    const totalStock = inventory.reduce((sum, inv) => sum + inv.stock_actual, 0);
    const lowStock = inventory.filter(inv => inv.stock_actual <= inv.stock_minimo);
    const recentSales = [...sales].sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime()).slice(0, 5);

    return { todaySales: todaySales.length, todayRevenue, todayProfit, totalProfit, totalStock, lowStockCount: lowStock.length, recentSales };
  }, [inventory, sales, variants, getTodaySales]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const kpis = [
    { title: t('dashboard.salesToday'), value: stats.todaySales.toString(), icon: 'cart-outline', color: C.accent, bg: C.accentLight },
    { title: 'Ganancia hoy', value: `S/ ${stats.todayProfit.toFixed(0)}`, icon: 'trending-up-outline', color: C.success, bg: C.successLight },
    { title: 'Ganancia total', value: `S/ ${stats.totalProfit.toFixed(0)}`, icon: 'wallet-outline', color: C.warning, bg: C.warningLight },
    { title: t('inventory.lowStock'), value: stats.lowStockCount.toString(), icon: 'alert-circle-outline', color: C.danger, bg: C.dangerLight },
  ];

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, { color: C.text }]}>{t('dashboard.greeting')}, Colaborador</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('dashboard.summary')}</Text>
        </View>

        <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
          {kpis.map((kpi, index) => (
            <View key={index} style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: kpi.bg }]}>
                <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
              </View>
              <Text style={[styles.kpiValue, { color: C.text }]}>{kpi.value}</Text>
              <Text style={[styles.kpiTitle, { color: C.textMuted }]}>{kpi.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>{t('sales.title')} recientes</Text>
          {stats.recentSales.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('sales.empty')}</Text>
          ) : (
            <View style={[styles.scrollContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
                indicatorStyle={C.textMuted}
              >
                {stats.recentSales.map(sale => {
                  const saleProfit = (sale.detalles || []).reduce((sum, d) => {
                    const v = variants.find(va => va.id === d.id_variante);
                    const pc = v?.precio_compra || 0;
                    return sum + ((d.precio_unitario - pc) * d.cantidad);
                  }, 0);
                  return (
                  <View key={sale.id} style={[styles.listItem, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.listIcon, { backgroundColor: C.successLight }]}>
                      <Ionicons name="cart" size={16} color={C.success} />
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={[styles.listTitle, { color: C.text }]}>{formatDate(sale.fecha_venta)}</Text>
                      <Text style={[styles.listMeta, { color: C.textMuted }]}>{sale.detalles?.length || 0} productos</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.listValue, { color: C.success }]}>S/ {sale.total_venta.toFixed(2)}</Text>
                      <Text style={[styles.listMeta, { color: saleProfit >= 0 ? C.success : C.danger }]}>+S/ {saleProfit.toFixed(2)}</Text>
                    </View>
                  </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, paddingBottom: 100 },
  greetingRow: { marginBottom: Spacing.xl },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: 4 },
  subtitle: { fontSize: FontSize.lg },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, marginBottom: Spacing.xl },
  kpiGridDesktop: { flexWrap: 'nowrap' },
  kpiCard: {
    width: '47.5%', borderRadius: BorderRadius.lg, padding: Spacing.xl,
    borderWidth: 1, ...Shadows.sm,
  },
  kpiCardDesktop: {
    width: 'auto', flex: 1,
  },
  kpiIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  kpiValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  kpiTitle: { fontSize: FontSize.sm, marginTop: 4 },
  section: { marginBottom: Spacing.xl },
  scrollContainer: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.sm, height: 320 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  listItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm, borderWidth: 1,
  },
  listIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  listInfo: { flex: 1 },
  listTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  listMeta: { fontSize: FontSize.sm },
  listValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  emptyText: { fontSize: FontSize.md, textAlign: 'center', paddingVertical: Spacing.xl },
});
