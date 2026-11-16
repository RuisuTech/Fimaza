import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export type AdminNavKey =
  | 'Inicio'
  | 'Gestión'
  | 'Ventas'
  | 'Compras'
  | 'Almacén'
  | 'Reportes';

const PALETTE = {
  panel: '#0B2545',
  active: '#255bb3',
  logo: '#3b82f6',
  white: '#ffffff',
  navText: 'rgba(255, 255, 255, 0.78)',
};

const NAV_LINKS: { label: AdminNavKey; route: string }[] = [
  { label: 'Inicio', route: '/(admin)' },
  { label: 'Gestión', route: '/(admin)/usuarios' },
  { label: 'Ventas', route: '/(admin)/ventas/carrito' },
  { label: 'Compras', route: '/(admin)/compras/pedidos' },
  { label: 'Almacén', route: '/(admin)/almacen/guia-salida' },
  { label: 'Reportes', route: '/(admin)/reportes/ventas' },
];

interface AdminTopNavProps {
  active: AdminNavKey;
  hideLinks?: boolean;
}

export default function AdminTopNav({ active, hideLinks = false }: AdminTopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { log } = useActivity();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const isCompact = width < 420;

  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Colaborador';

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user) log(Number(user.id) || 0, 'LOGOUT', 'Cerró sesión');
    logout();
    router.dismissAll();
    router.replace('/login');
  };

  const handleOpen = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(route as any);
  };

  const navLinks = NAV_LINKS.map(link => {
    const isActive = link.label === active;
    return (
      <TouchableOpacity
        key={link.label}
        style={[styles.navLink, isActive && styles.navLinkActive]}
        onPress={() => {
          if (isActive) return;
          handleOpen(link.route);
        }}
        activeOpacity={0.8}
        accessibilityRole="link"
        accessibilityState={{ selected: isActive }}
      >
        <Text style={[styles.navLinkText, isActive && styles.navLinkTextActive]}>
          {link.label}
        </Text>
      </TouchableOpacity>
    );
  });

  const brand = (
    <View style={styles.brandRow}>
      <View style={styles.logoBox}>
        <Text style={styles.logoLetter}>F</Text>
      </View>
      <Text style={styles.brandName}>FIMAZA</Text>
    </View>
  );

  const rightActions = (
    <View style={styles.navRight}>
      {!isCompact && (
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        {isCompact ? (
          <Ionicons name="log-out-outline" size={20} color={PALETTE.white} />
        ) : (
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar style="light" />
      {isMobile ? (
        <View style={[styles.navbarMobile, { paddingTop: insets.top + 10 }]}>
          <View style={styles.navMobileTop}>
            {brand}
            {rightActions}
          </View>
          {!hideLinks && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navLinksMobile}
            >
              {navLinks}
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={[styles.navbar, { paddingTop: insets.top + 14 }]}>
          <View style={styles.navLeft}>
            {brand}
            {!hideLinks && <View style={styles.navLinks}>{navLinks}</View>}
          </View>
          {rightActions}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: PALETTE.panel,
    paddingHorizontal: 32,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  navbarMobile: {
    backgroundColor: PALETTE.panel,
  },
  navMobileTop: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    flexShrink: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: PALETTE.logo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: PALETTE.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  brandName: {
    color: PALETTE.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  navLinksMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
  },
  navLink: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.sm,
  },
  navLinkActive: {
    backgroundColor: PALETTE.active,
  },
  navLinkText: {
    color: PALETTE.navText,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  navLinkTextActive: {
    color: PALETTE.white,
    fontWeight: FontWeight.semibold,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    flexShrink: 0,
  },
  logoutButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  rolePill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleText: {
    color: PALETTE.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  logoutText: {
    color: PALETTE.white,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});
