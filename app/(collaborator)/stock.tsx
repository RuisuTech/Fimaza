import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/context/ProductsContext';
import { useCatalogs } from '@/context/CatalogsContext';
import DashboardLayout from '@/components/DashboardLayout';
import { collaboratorNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function StockScreen() {
  const { products, variants, inventory } = useProducts();
  const { marcas, tallas, colores } = useCatalogs();
  const C = useThemeColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const getMarcaName = useCallback((id: number) => marcas.find(m => m.id === id)?.nombre_marca || '', [marcas]);
  const getTallaName = useCallback((id: number) => tallas.find(t => t.id === id)?.numero_talla || '', [tallas]);
  const getColorName = useCallback((id: number) => colores.find(c => c.id === id)?.nombre_color || '', [colores]);

  const stockData = useMemo(() => {
    return inventory.map(inv => {
      const variant = variants.find(v => v.id === inv.id_variante);
      const product = variant ? products.find(p => p.id === variant.id_producto) : null;
      return { inventory: inv, variant, product };
    }).filter(item => item.variant && item.product);
  }, [inventory, variants, products]);

  const filtered = useMemo(() => {
    if (!search) return stockData;
    const s = search.toLowerCase();
    return stockData.filter(item => {
      const productName = item.product?.nombre.toLowerCase() || '';
      const marcaName = item.product ? getMarcaName(item.product.id_marca).toLowerCase() : '';
      const tallaName = item.variant ? getTallaName(item.variant.id_talla).toLowerCase() : '';
      const colorName = item.variant ? getColorName(item.variant.id_color).toLowerCase() : '';
      return productName.includes(s) || marcaName.includes(s) || tallaName.includes(s) || colorName.includes(s);
    });
  }, [stockData, search, getMarcaName, getTallaName, getColorName]);

  const totalUnits = useMemo(() => stockData.reduce((sum, item) => sum + item.inventory.stock_actual, 0), [stockData]);
  const lowStockCount = useMemo(() => stockData.filter(item => item.inventory.stock_actual <= item.inventory.stock_minimo).length, [stockData]);

  const renderItem = ({ item }: { item: typeof stockData[0] }) => {
    const isLow = item.inventory.stock_actual <= item.inventory.stock_minimo;
    const isOut = item.inventory.stock_actual === 0;
    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: isOut ? C.dangerLight : isLow ? C.warningLight : C.successLight }]}>
            <Ionicons name="cube" size={18} color={isOut ? C.danger : isLow ? C.warning : C.success} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{item.product?.nombre}</Text>
            <Text style={[styles.cardMeta, { color: C.textMuted }]}>
              {getMarcaName(item.product?.id_marca || 0)} · Talla {getTallaName(item.variant?.id_talla || 0)} · {getColorName(item.variant?.id_color || 0)}
            </Text>
          </View>
          <View style={styles.stockBadge}>
            <Text style={[styles.stockValue, { color: isOut ? C.danger : isLow ? C.warning : C.text }]}>{item.inventory.stock_actual}</Text>
            <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
          </View>
        </View>
        {isLow && (
          <View style={[styles.lowStockBadge, { backgroundColor: C.dangerLight }]}>
            <Ionicons name="alert-circle" size={14} color={C.danger} />
            <Text style={[styles.lowStockText, { color: C.danger }]}>{t('stock.lowAlert')} (min: {item.inventory.stock_minimo})</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('stock.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('stock.subtitle')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent }]}>
          <Text style={[styles.statValue, { color: C.text }]}>{totalUnits}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('stock.available')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.danger }]}>
          <Text style={[styles.statValue, { color: C.danger }]}>{lowStockCount}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>{t('stock.lowAlert')}</Text>
        </View>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder={t('stock.search')}
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.inventory.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
          </View>
        }
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md },
  statsRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  statCard: {
    flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderLeftWidth: 3, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1,
  },
  searchInput: { flex: 1, height: TouchTarget.minimum, fontSize: FontSize.md, marginLeft: Spacing.sm },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: { borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardMeta: { fontSize: FontSize.xs, marginTop: 2 },
  stockBadge: { alignItems: 'flex-end' },
  stockValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  stockLabel: { fontSize: FontSize.xs },
  lowStockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.md, padding: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  lowStockText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
