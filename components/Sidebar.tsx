import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export interface NavItem {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SidebarProps {
  items: NavItem[];
  accentColor?: string;
}

export default function Sidebar({ items, accentColor }: SidebarProps) {
  const C = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { user, logout } = useAuth();
  const { log } = useActivity();
  const { settings } = useSettings();

  const currentAccent = accentColor ?? C.accent;

  const currentRoute = '/' + segments.filter((s: string) => !s.startsWith('(')).join('/');
  const normalize = (r: string) => '/' + r.split('/').filter((s: string) => s && !s.startsWith('(')).join('/');

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user) log(user.id, 'LOGOUT', 'Cerro sesion');
    logout();
    router.dismissAll();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderRightColor: C.border }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={[styles.logoIcon, { backgroundColor: currentAccent + '15' }]}>
          <Ionicons name="cube" size={24} color={currentAccent} />
        </View>
        <Text style={[styles.logoText, { color: currentAccent }]}>{settings.systemName}</Text>
      </View>

      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const isActive = normalize(item.route) === currentRoute;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isActive && { backgroundColor: currentAccent + '10' }]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.icon : `${item.icon.replace('-outline', '')}-outline` as any}
                size={20}
                color={isActive ? currentAccent : C.textMuted}
              />
              <Text style={[styles.navText, { color: C.textSecondary }, isActive && { color: currentAccent, fontWeight: FontWeight.semibold }]}>
                {item.label}
              </Text>
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: currentAccent }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: C.border }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: currentAccent }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>{user?.name}</Text>
            <Text style={[styles.userRole, { color: C.textMuted }]}>{user?.role === 'admin' ? t('role.admin') : t('role.collaborator')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={C.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 240;

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  navList: {
    flex: 1,
    padding: Spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    minHeight: TouchTarget.minimum,
  },
  navText: {
    flex: 1,
    fontSize: FontSize.md,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  userRole: {
    fontSize: FontSize.xs,
  },
  logoutBtn: {
    width: TouchTarget.minimum,
    height: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
});
