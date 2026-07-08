import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '@/components/Sidebar';
import BottomTabBar from '@/components/BottomTabBar';
import type { NavItem } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BorderRadius, FontSize, FontWeight, TouchTarget, Spacing } from '@/constants/theme';

const MOBILE_BREAKPOINT = 768;

interface DashboardLayoutProps {
  children: React.ReactNode;
  items: NavItem[];
  accentColor?: string;
}

export default function DashboardLayout({ children, items, accentColor }: DashboardLayoutProps) {
  const C = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const router = useRouter();
  const { user, logout } = useAuth();
  const { log } = useActivity();
  const { settings } = useSettings();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user) log(user.id, 'LOGOUT', 'Cerro sesion');
    logout();
    router.dismissAll();
    router.replace('/login');
  };

  if (isMobile) {
    return (
      <View style={[styles.mobileContainer, { backgroundColor: C.background }]}>
        <View style={[styles.mobileHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <Text style={[styles.mobileHeaderTitle, { color: C.accent }]}>{settings.systemName}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={C.danger} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <BottomTabBar items={items} />
      </View>
    );
  }

  return (
    <View style={[styles.desktopContainer, { backgroundColor: C.background }]}>
      <Sidebar items={items} accentColor={accentColor} />
      <ScrollView
        style={styles.desktopScroll}
        contentContainerStyle={styles.desktopContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  mobileHeaderTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  logoutBtn: {
    width: TouchTarget.minimum,
    height: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  mobileScroll: {
    flex: 1,
  },
  mobileContent: {
    padding: 16,
    paddingBottom: 100,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopScroll: {
    flex: 1,
  },
  desktopContent: {
    padding: 24,
    maxWidth: 1200,
  },
});
