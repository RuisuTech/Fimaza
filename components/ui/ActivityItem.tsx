import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BorderRadius, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface Activity {
  id: string;
  userId: string;
  action: string;
  detail: string;
  timestamp: string;
}

interface ActivityItemProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
  showDivider?: boolean;
}

const ACTION_ICONS: Record<string, string> = {
  LOGIN: '🔑',
  LOGOUT: '🚪',
  AGREGAR_PRODUCTO: '📦',
  EDITAR_PRODUCTO: '✏️',
  ELIMINAR_PRODUCTO: '🗑️',
  VENTA: '💰',
  STOCK_UPDATE: '📊',
};

export const ActivityItem = React.memo<ActivityItemProps>(({
  activity,
  onPress,
  showDivider = true,
}) => {
  const C = useThemeColors();

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: C.accent,
    LOGOUT: C.textMuted,
    AGREGAR_PRODUCTO: C.success,
    EDITAR_PRODUCTO: C.warning,
    ELIMINAR_PRODUCTO: C.danger,
    VENTA: C.success,
    STOCK_UPDATE: C.accent,
  };

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(activity);
  }, [activity, onPress]);

  const timeString = useMemo(() => {
    const date = new Date(activity.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }, [activity.timestamp]);

  const icon = ACTION_ICONS[activity.action] || '📋';
  const accentColor = ACTION_COLORS[activity.action] || C.textMuted;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${activity.action}: ${activity.detail}`}
    >
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + '15' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.detail, { color: C.text }]} numberOfLines={1}>
          {activity.detail}
        </Text>
        <Text style={[styles.action, { color: C.textMuted }]}>{activity.action.replace(/_/g, ' ')}</Text>
      </View>

      <Text style={[styles.time, { color: C.textMuted }]}>{timeString}</Text>

      {showDivider && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
    </TouchableOpacity>
  );
});

ActivityItem.displayName = 'ActivityItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: TouchTarget.minimum,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  detail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  action: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 48,
    right: 0,
    height: 1,
  },
});
