import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/context/ProductsContext';
import DashboardLayout from '@/components/DashboardLayout';
import { collaboratorNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function InventarioScreen() {
  const { products } = useProducts();
  const C = useThemeColors();
  const { t } = useTranslation();

  const lowStock = useMemo(() => products.filter(p => p.quantity <= p.minStock), [products]);
  const totalPairs = useMemo(() => products.reduce((sum, p) => sum + p.quantity, 0), [products]);

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('inventory.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{products.length} {t('inventory.models')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: C.accent, backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="walk-outline" size={22} color={C.accent} />
          <Text style={[styles.statValue, { color: C.text }]}>{products.length}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('dashboard.products')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: C.success, backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="layers-outline" size={22} color={C.success} />
          <Text style={[styles.statValue, { color: C.text }]}>{totalPairs}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('inventory.pairs')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: C.danger, backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="alert-circle-outline" size={22} color={C.danger} />
          <Text style={[styles.statValue, { color: C.text }]}>{lowStock.length}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('products.lowStock')}</Text>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.cardIcon, { backgroundColor: C.accentLight }]}>
              <Ionicons name="walk" size={20} color={C.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: C.text }]}>{item.name}</Text>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: C.accentLight }]}>
                  <Text style={[styles.tagText, { color: C.accent }]}>{item.brand}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: C.successLight }]}>
                  <Text style={[styles.tagText, { color: C.success }]}>Talla {item.size}</Text>
                </View>
                <Text style={[styles.cardSku, { color: C.textMuted }]}>{item.sku}</Text>
              </View>
            </View>
            <View style={styles.stockContainer}>
              <Text style={[styles.stockValue, item.quantity <= item.minStock && styles.stockLow, { color: item.quantity <= item.minStock ? C.danger : C.text }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="walk-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
          </View>
        }
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: {
    flex: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1,
    borderLeftWidth: 3, alignItems: 'center', ...Shadows.sm,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSize.xs },
  listContent: { paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: 4 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardSku: { fontSize: FontSize.xs },
  stockContainer: { alignItems: 'flex-end' },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockLow: {},
  stockLabel: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
