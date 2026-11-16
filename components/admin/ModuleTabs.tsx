import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export interface ModuleTab {
  label: string;
  route: string;
  active: boolean;
}

export default function ModuleTabs({ items }: { items: ModuleTab[] }) {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.container}
    >
      <View style={styles.group}>
        {items.map(item => (
          <TouchableOpacity
            key={item.route}
            style={[styles.tab, item.active && styles.tabActive]}
            onPress={() => {
              if (item.active) return;
              Haptics.selectionAsync();
              router.replace(item.route as any);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: item.active }}
          >
            <Text style={[styles.label, item.active && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    flexGrow: 0,
  },
  scroll: {
    paddingRight: 8,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: ADMIN.border,
    backgroundColor: ADMIN.card,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm - 2,
  },
  tabActive: {
    backgroundColor: ADMIN.active,
  },
  label: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  labelActive: {
    color: ADMIN.white,
    fontWeight: FontWeight.semibold,
  },
});
