import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Shadows, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

export const KPICard = React.memo<KPICardProps>(({
  title,
  value,
  icon,
  color,
  trend,
  onPress,
}) => {
  const C = useThemeColors();
  const currentColor = color ?? C.accent;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: currentColor + '12' }]}>
          <Ionicons name={icon} size={20} color={currentColor} />
        </View>
        {trend && (
          <View style={[
            styles.trendBadge,
            { backgroundColor: trend.isPositive ? C.successLight : C.dangerLight }
          ]}>
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? C.success : C.danger}
            />
            <Text style={[
              styles.trendText,
              { color: trend.isPositive ? C.success : C.danger }
            ]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: C.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.title, { color: C.textSecondary }]} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
});

KPICard.displayName = 'KPICard';

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flex: 1,
    minHeight: 110,
    borderWidth: 1,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
