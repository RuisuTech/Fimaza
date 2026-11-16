import React, { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AdminTopNav, { AdminNavKey } from '@/components/AdminTopNav';
import ModuleTabs, { ModuleTab } from '@/components/admin/ModuleTabs';
import { ADMIN } from '@/constants/adminTheme';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';

interface AdminPageProps {
  active: AdminNavKey;
  title: string;
  subtitle?: string;
  tabs?: ModuleTab[];
  maxWidth?: number;
  children: ReactNode;
}

export default function AdminPage({
  active,
  title,
  subtitle,
  tabs,
  maxWidth = 1200,
  children,
}: AdminPageProps) {
  const { isMobile } = useAdminLayout();

  return (
    <View style={styles.page}>
      <AdminTopNav active={active} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { maxWidth }]}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {tabs ? <ModuleTabs items={tabs} /> : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: ADMIN.page,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
  },
  scrollContentMobile: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  content: {
    width: '100%',
  },
  title: {
    color: ADMIN.heading,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  titleMobile: {
    fontSize: 27,
    lineHeight: 33,
  },
  subtitle: {
    color: ADMIN.textMuted,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 20,
  },
});
