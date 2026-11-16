import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminTopNav from '@/components/AdminTopNav';
import { useAuth } from '@/context/AuthContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';

const PALETTE = {
  page: '#f4f5f7',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  heading: '#0f2b4e',
  textMuted: '#6b7280',
  active: '#255bb3',
  activeLight: '#eff6ff',
};

const CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
  : Shadows.sm;

export default function CollaboratorHome() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const firstName = user?.name?.split(' ')[0] || 'colaborador';

  return (
    <View style={styles.page}>
      <AdminTopNav active="Inicio" hideLinks />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            Hola, {firstName}
          </Text>
          <Text style={styles.subtitle}>
            Tu cuenta está activa. Los módulos para tu rol se están preparando.
          </Text>

          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct-outline" size={28} color={PALETTE.active} />
            </View>
            <Text style={styles.cardTitle}>Módulos en preparación</Text>
            <Text style={styles.cardText}>
              Cuando estén listos verás aquí las opciones disponibles para tu rol.
              Mientras tanto, puedes cerrar sesión desde la barra superior.
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons name="person-outline" size={14} color={PALETTE.active} />
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PALETTE.page,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
  },
  scrollContentMobile: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 720,
  },
  title: {
    color: PALETTE.heading,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: Spacing.xxl,
    ...CARD_SHADOW,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: PALETTE.activeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    color: PALETTE.heading,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  cardText: {
    color: PALETTE.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 21,
    marginTop: Spacing.sm,
    maxWidth: 520,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: PALETTE.activeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleText: {
    color: PALETTE.active,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
