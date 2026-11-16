import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ADMIN, ADMIN_SHADOW } from '@/constants/adminTheme';
import { BorderRadius, FontWeight, Spacing } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';

interface AdminCardProps {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  noBodyPadding?: boolean;
}

export default function AdminCard({
  title,
  children,
  style,
  bodyStyle,
  noBodyPadding = false,
}: AdminCardProps) {
  const { isMobile } = useAdminLayout();

  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.body,
          isMobile && styles.bodyMobile,
          noBodyPadding && styles.noPadding,
          bodyStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ADMIN.border,
    ...ADMIN_SHADOW,
  },
  header: {
    backgroundColor: ADMIN.cardHeader,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopLeftRadius: BorderRadius.md - 1,
    borderTopRightRadius: BorderRadius.md - 1,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.rowBorder,
  },
  headerText: {
    color: ADMIN.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  body: {
    padding: Spacing.xl,
    gap: 14,
  },
  bodyMobile: {
    padding: Spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
});
