import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, TouchTarget, FontSize, FontWeight } from '@/constants/theme';
import { Product } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductListProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onAddPress?: () => void;
  ListEmptyComponent?: React.ReactElement;
}

interface ProductItemProps {
  product: Product;
  onPress?: (product: Product) => void;
}

const ProductItem = React.memo<ProductItemProps>(({ product, onPress }) => {
  const C = useThemeColors();
  const { t } = useTranslation();
  const isLowStock = product.quantity <= product.minStock;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(product);
  }, [product, onPress]);

  return (
    <TouchableOpacity
      style={[styles.productItem, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.productIcon, { backgroundColor: C.accentLight }]}>
        <Ionicons name="walk-outline" size={24} color={C.accent} />
      </View>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: C.text }]} numberOfLines={1}>{product.name}</Text>
        <View style={styles.productMetaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{product.brand}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: C.successLight }]}>
            <Text style={[styles.metaChipText, { color: C.success }]}>Talla {product.size}</Text>
          </View>
          <Text style={[styles.productSku, { color: C.textMuted }]}>{product.sku}</Text>
        </View>
      </View>

      <View style={styles.stockContainer}>
        <Text style={[styles.stockValue, isLowStock && { color: C.danger }, !isLowStock && { color: C.text }]}>{product.quantity}</Text>
        <Text style={[styles.stockLabel, { color: C.textMuted }]}>{t('products.pairs')}</Text>
      </View>

      {isLowStock && (
        <View style={[styles.lowStockBadge, { backgroundColor: C.dangerLight }]}>
          <Text style={[styles.lowStockText, { color: C.danger }]}>{t('products.lowStock')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

ProductItem.displayName = 'ProductItem';

export const ProductList = React.memo<ProductListProps>(({
  products,
  onProductPress,
  onAddPress,
  ListEmptyComponent,
}) => {
  const C = useThemeColors();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductItem product={item} onPress={onProductPress} />
  ), [onProductPress]);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const handleCategoryPress = useCallback((category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(prev => prev === category ? null : category);
  }, []);

  const ListHeaderComponentMemo = useMemo(() => (
    <View>
      <View style={[styles.searchContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={20} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder={t('products.search')}
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item
                ? [styles.categoryChipActive, { backgroundColor: C.accentLight, borderColor: C.accent }]
                : { backgroundColor: C.surface, borderColor: C.border }
            ]}
            onPress={() => handleCategoryPress(item)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item
                ? [styles.categoryTextActive, { color: C.accent }]
                : { color: C.textSecondary }
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  ), [searchQuery, categories, selectedCategory, handleCategoryPress, C, t]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponentMemo}
        ListEmptyComponent={ListEmptyComponent || (
          <View style={styles.emptyContainer}>
            <Ionicons name="walk-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>{t('products.noResults')}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        removeClippedSubviews={true}
      />

      {onAddPress && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: C.accent, shadowColor: C.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAddPress();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
});

ProductList.displayName = 'ProductList';

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, height: TouchTarget.minimum, fontSize: FontSize.md, marginLeft: Spacing.sm },
  categoryList: { paddingBottom: Spacing.md, gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryChipActive: { },
  categoryText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  categoryTextActive: { },
  productItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  productIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  productInfo: { flex: 1, marginRight: Spacing.md },
  productName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: 4 },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  metaChip: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  metaChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  productSku: { fontSize: FontSize.xs },
  stockContainer: { alignItems: 'flex-end', marginRight: Spacing.sm },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stockLow: { },
  stockLabel: { fontSize: FontSize.xs },
  lowStockBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm,
  },
  lowStockText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
  fab: {
    position: 'absolute', right: Spacing.xl, bottom: Spacing.xl, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});
