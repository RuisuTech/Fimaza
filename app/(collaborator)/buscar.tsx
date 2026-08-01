import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/context/ProductsContext';
import DashboardLayout from '@/components/DashboardLayout';
import { collaboratorNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function BuscarScreen() {
  const { products } = useProducts();
  const C = useThemeColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

  return (
    <DashboardLayout items={collaboratorNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('search.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('search.subtitle')}</Text>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: C.surface, borderColor: searchFocused ? C.accent : C.border }]}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          underlineColorAndroid="transparent"
          selectionColor={C.accent}
          autoFocus
        />
        {search.length > 0 && (
          <Ionicons name="close-circle" size={18} color={C.textMuted} onPress={() => setSearch('')} />
        )}
      </View>

      <Text style={[styles.resultCount, { color: C.textMuted }]}>{filtered.length} {t('search.results')}</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.cardIcon, { backgroundColor: C.accentLight }]}>
              <Ionicons name="cube" size={20} color={C.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: C.text }]}>{item.name}</Text>
              <Text style={[styles.cardSku, { color: C.textMuted }]}>{item.sku}</Text>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: C.accentLight }]}>
                  <Text style={[styles.tagText, { color: C.accent }]}>{item.category}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: C.successLight }]}>
                  <Text style={[styles.tagText, { color: C.success }]}>{item.location}</Text>
                </View>
              </View>
            </View>
            <View style={styles.stockContainer}>
              <Text style={[styles.stockValue, item.quantity <= item.minStock && styles.stockLow, { color: item.quantity <= item.minStock ? C.danger : C.text }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('common.units')}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{search ? t('search.noResults') : t('search.typeToSearch')}</Text>
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
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  searchInput: { flex: 1, height: TouchTarget.minimum, fontSize: FontSize.md, marginLeft: Spacing.sm },
  resultCount: {
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardSku: { fontSize: FontSize.sm, marginTop: 2 },
  tagsRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  stockContainer: { alignItems: 'flex-end' },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockLow: {},
  stockLabel: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
