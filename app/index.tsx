import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xxxxl }]}>
        <View style={styles.hero}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="cube" size={48} color={Colors.light.accent} />
            </View>
          </View>
          
          <Text style={styles.brand}>FimazaSys</Text>
          <Text style={styles.tagline}>Gestion de inventario inteligente</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.light.accentLight }]}>
              <Ionicons name="analytics-outline" size={22} color={Colors.light.accent} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Dashboard en tiempo real</Text>
              <Text style={styles.featureDesc}>Metricas y KPIs al instante</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.light.successLight }]}>
              <Ionicons name="cube-outline" size={22} color={Colors.light.success} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Control de stock</Text>
              <Text style={styles.featureDesc}>Alertas de stock bajo automaticas</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.light.warningLight }]}>
              <Ionicons name="receipt-outline" size={22} color={Colors.light.warning} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Registro de ventas</Text>
              <Text style={styles.featureDesc}>Historial completo de transacciones</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesion</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxxxl,
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.accentMuted,
  },
  brand: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.light.text,
    letterSpacing: -1,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.lg,
    color: Colors.light.textSecondary,
    fontWeight: FontWeight.regular,
  },
  features: {
    gap: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  bottom: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  loginButton: {
    backgroundColor: Colors.light.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  version: {
    textAlign: 'center',
    color: Colors.light.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.lg,
  },
});
