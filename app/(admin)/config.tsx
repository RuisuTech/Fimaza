import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/context/SettingsContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function ConfigScreen() {
  const { settings, updateSettings } = useSettings();
  const C = useThemeColors();
  const { t } = useTranslation();

  const handleToggleDarkMode = (value: boolean) => {
    Haptics.selectionAsync();
    updateSettings({ isDarkMode: value });
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{t('settings.title')}</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={18} color={C.warning} />
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{t('settings.appearance')}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="moon-outline" size={20} color={C.textSecondary} />
              <Text style={[styles.toggleLabel, { color: C.text }]}>{t('settings.darkMode')}</Text>
            </View>
            <Switch
              value={settings.isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: C.border, true: C.accentMuted }}
              thumbColor={settings.isDarkMode ? C.accent : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.md },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  toggleLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
});
