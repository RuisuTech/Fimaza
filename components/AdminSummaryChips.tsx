import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export type SummaryTone = 'default' | 'success' | 'warning' | 'muted';

export interface SummaryItem {
  label: string;
  value: number | string;
  tone?: SummaryTone;
}

const TONES: Record<SummaryTone, { background: string; border: string; text: string }> = {
  default: { background: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  success: { background: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
  warning: { background: '#fffbeb', border: '#fde68a', text: '#b45309' },
  muted: { background: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
};

export default function AdminSummaryChips({ items }: { items: SummaryItem[] }) {
  return (
    <View style={styles.row}>
      {items.map(item => {
        const tone = TONES[item.tone ?? 'default'];
        return (
          <View
            key={item.label}
            style={[
              styles.chip,
              { backgroundColor: tone.background, borderColor: tone.border },
            ]}
          >
            <Text style={[styles.label, { color: tone.text }]}>{item.label}</Text>
            <Text style={[styles.value, { color: tone.text }]}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
