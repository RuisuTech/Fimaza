import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export type BadgeTone = 'success' | 'info' | 'muted' | 'warning' | 'danger' | 'dark';

const TONES: Record<BadgeTone, { background: string; text: string }> = {
  success: { background: ADMIN.successSoft, text: ADMIN.success },
  info: { background: ADMIN.infoSoft, text: ADMIN.info },
  muted: { background: ADMIN.graySoft, text: ADMIN.grayText },
  warning: { background: ADMIN.warningSoft, text: ADMIN.warning },
  danger: { background: ADMIN.dangerSoft, text: ADMIN.danger },
  dark: { background: '#E2E8F0', text: ADMIN.heading },
};

export default function StatusBadge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const colors = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
