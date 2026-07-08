import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NavItem } from '@/components/Sidebar';
import { FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface BottomTabBarProps {
  items: NavItem[];
}

export default function BottomTabBar({ items }: BottomTabBarProps) {
  const C = useThemeColors();
  const router = useRouter();
  const segments = useSegments();

  const currentRoute = '/' + segments.filter((s: string) => !s.startsWith('(')).join('/');
  const normalize = (r: string) => '/' + r.split('/').filter((s: string) => s && !s.startsWith('(')).join('/');

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderTopColor: C.border }]}>
      {items.map((item) => {
        const isActive = normalize(item.route) === currentRoute;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.tab}
            onPress={() => handleNavigate(item.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.icon : `${item.icon.replace('-outline', '')}-outline` as any}
              size={22}
              color={isActive ? C.accent : C.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? C.accent : C.textMuted },
                isActive && { fontWeight: FontWeight.semibold },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: TouchTarget.minimum,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
