import React from 'react';
import {
  View, Text, TextInput, StyleSheet, Switch, ScrollView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function ConfigScreen() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { log } = useActivity();
  const C = useThemeColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleToggleDarkMode = (value: boolean) => {
    Haptics.selectionAsync();
    updateSettings({ isDarkMode: value });
    if (user) log(user.employeeId!, 'SETTINGS_CHANGED', `Modo oscuro ${value ? 'activado' : 'desactivado'}`);
  };

  const handleUpdateField = (field: keyof typeof settings, value: string | number) => {
    Haptics.selectionAsync();
    updateSettings({ [field]: value });
    if (user) log(user.employeeId!, 'SETTINGS_CHANGED', `Campo "${field}" actualizado`);
  };

  return (
    <DashboardLayout items={adminNavItems}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>{t('settings.title')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('settings.subtitle')}</Text>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true} indicatorStyle={C.textMuted}>
        <View style={[isDesktop ? styles.grid : { paddingHorizontal: Spacing.xl }]}>
          <View style={isDesktop ? styles.column : undefined}>
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

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={18} color={C.accent} />
                <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{t('settings.business')}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{t('settings.businessName')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    value={settings.businessName}
                    onChangeText={(v) => handleUpdateField('businessName', v)}
                    placeholder="Nombre del negocio"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{t('settings.businessAddress')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    value={settings.businessAddress}
                    onChangeText={(v) => handleUpdateField('businessAddress', v)}
                    placeholder="Dirección"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{t('settings.businessPhone')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    value={settings.businessPhone}
                    onChangeText={(v) => handleUpdateField('businessPhone', v)}
                    placeholder="Teléfono"
                    placeholderTextColor={C.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={isDesktop ? styles.column : undefined}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={18} color={C.success} />
                <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{t('settings.taxes')}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{t('settings.igvRate')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    value={settings.igvRate.toString()}
                    onChangeText={(v) => handleUpdateField('igvRate', parseInt(v) || 0)}
                    placeholder="18"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="phone-portrait-outline" size={18} color={C.accent} />
                <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{t('settings.yape')}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{t('settings.yapeNumber')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                    value={settings.yapeNumber}
                    onChangeText={(v) => handleUpdateField('yapeNumber', v)}
                    placeholder="999 888 777"
                    placeholderTextColor={C.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.lg },
  scrollContent: { flex: 1 },
  grid: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  column: { flex: 1 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md, fontWeight: FontWeight.semibold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl, borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  toggleLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.medium },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
  },
});
