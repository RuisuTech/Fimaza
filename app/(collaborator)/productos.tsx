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
import { Producto } from '@/types';

export default function ProductosScreen() {
  const { products, variants, inventory } = useProducts();
  const { marcas, categorias, tallas, colores } = useCatalogs();
  const C = useThemeColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const getMarcaName = useCallback((id: number) => marcas.find(m => m.id === id)?.nombre_marca || '', [marcas]);
  const getCategoriaName = useCallback((id: number) => categorias.find(c => c.id === id)?.nombre_categoria || '', [categorias]);
  const getTallaName = useCallback((id: number) => tallas.find(t => t.id === id)?.numero_talla || '', [tallas]);
  const getColorName = useCallback((id: number) => colores.find(c => c.id === id)?.nombre_color || '', [colores]);
  const getTotalStock = (productId: number) => {
    const pVariants = variants.filter(v => v.id_producto === productId);
    return pVariants.reduce((sum, v) => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return sum + (inv?.stock_actual || 0);
    }, 0);
  };

  const filtered = useMemo(() => {
    if (!search) return products.filter(p => p.estado);
    const s = search.toLowerCase();
    return products.filter(p =>
      p.estado && (
        p.nombre.toLowerCase().includes(s) ||
        getMarcaName(p.id_marca).toLowerCase().includes(s) ||
        getCategoriaName(p.id_categoria).toLowerCase().includes(s) ||
        variants.some(v => v.id_producto === p.id && v.codigo_barras?.toLowerCase().includes(s))
      )
    );
  }, [products, variants, search, getMarcaName, getCategoriaName]);

  const renderItem = ({ item }: { item: Producto }) => {
    const pVariants = variants.filter(v => v.id_producto === item.id);
    const totalStock = getTotalStock(item.id);
    const isLow = pVariants.some(v => {
      const inv = inventory.find(i => i.id_variante === v.id);
      return inv && inv.stock_actual <= inv.stock_minimo;
    });

    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: isLow ? C.dangerLight : C.accentLight }]}>
            <Ionicons name="cube" size={20} color={isLow ? C.danger : C.accent} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{item.nombre}</Text>
            <Text style={[styles.cardMeta, { color: C.textMuted }]}>
              {getMarcaName(item.id_marca)} · {getCategoriaName(item.id_categoria)}
            </Text>
          </View>
          <View style={styles.stockBadge}>
            <Text style={[styles.stockValue, { color: isLow ? C.danger : C.text }]}>{totalStock}</Text>
            <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
          </View>
        </View>
        <View style={styles.variantsRow}>
          {pVariants.slice(0, 5).map(v => {
            const inv = inventory.find(i => i.id_variante === v.id);
            const stock = inv?.stock_actual || 0;
            return (
              <View key={v.id} style={[styles.variantPill, { backgroundColor: stock <= 0 ? C.dangerLight : stock <= (inv?.stock_minimo || 5) ? C.warningLight : C.successLight }]}>
                <Text style={[styles.variantPillText, { color: stock <= 0 ? C.danger : stock <= (inv?.stock_minimo || 5) ? C.warning : C.success }]}>
                  {getTallaName(v.id_talla)} {getColorName(v.id_color)}: {stock}
                </Text>
              </View>
            );
          })}
          {pVariants.length > 5 && (
            <Text style={[styles.moreText, { color: C.textMuted }]}>+{pVariants.length - 5}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>{t('products.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{filtered.length} {t('products.count')}</Text>
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder={t('products.search')}
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={[styles.listContainer, { borderColor: C.border, backgroundColor: C.surface }]}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle={C.textMuted}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.empty')}</Text>
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
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.lg, marginLeft: Spacing.md },
  listContainer: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', maxHeight: 420 },
  listContent: { padding: Spacing.sm },
  card: {
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  cardMeta: { fontSize: FontSize.sm },
  stockBadge: { alignItems: 'flex-end' },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockLabel: { fontSize: FontSize.sm },
  variantsRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.md, flexWrap: 'wrap' },
  variantPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  variantPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  moreText: { fontSize: FontSize.sm, alignSelf: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, marginTop: Spacing.lg },
});
