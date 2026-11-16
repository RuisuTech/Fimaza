import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows, TouchTarget } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PALETTE = {
  panel: '#0f2b4e',
  logo: '#3b82f6',
  panelText: '#ffffff',
  panelMuted: 'rgba(255, 255, 255, 0.62)',
  panelBody: '#c9d7ea',
  check: '#8ab4f8',
  page: '#f4f5f7',
  card: '#ffffff',
  heading: '#111827',
  subtext: '#6b7280',
  label: '#1f2937',
  inputBorder: '#d0d5dd',
  inputText: '#111827',
  placeholder: '#9ca3af',
  alertBg: '#fff7ea',
  alertBorder: '#f5c26b',
  alertIcon: '#b45309',
  alertText: '#4a3b22',
  button: '#255bb3',
};

const FEATURES = [
  'Stock que se descuenta con cada venta',
  'Ventas con su responsable',
  'Acceso por rol',
];

const INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos. Revisa tus datos.';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usuarioFocused, setUsuarioFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const { log } = useActivity();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const passwordRef = useRef<TextInput>(null);
  const isWide = width >= 900;

  const handleLogin = async () => {
    if (loading) return;

    if (!usuario.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(INVALID_CREDENTIALS);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(usuario.trim(), password);
      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error ?? INVALID_CREDENTIALS);
      } else if (result.user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        log(Number(result.user.id) || 0, 'LOGIN', `Sesión iniciada como ${result.user.role}`);
      }
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWide ? styles.scrollContentWide : styles.scrollContentNarrow,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.infoPanel,
            isWide ? styles.infoPanelWide : styles.infoPanelNarrow,
            !isWide && { paddingTop: insets.top + Spacing.xxl, paddingBottom: Spacing.xxl },
          ]}
        >
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>F</Text>
            </View>
            <View>
              <Text style={styles.brandName}>FIMAZA</Text>
              <Text style={styles.brandSubtitle}>Multiplataforma · Calzado</Text>
            </View>
          </View>

          {isWide ? (
            <>
              <View style={styles.heroWide}>
                <Text style={[styles.heroTitle, styles.heroTitleWide]}>
                  Gestión de ventas e inventario en un solo lugar
                </Text>
                <Text style={styles.heroText}>
                  Registra clientes, productos y proveedores, y mantén el stock siempre al día con cada venta.
                </Text>

                <View style={styles.features}>
                  {FEATURES.map(feature => (
                    <View key={feature} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={PALETTE.check} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.panelFooter}>© FIMAZA · Fimaza Multiplataforma</Text>
            </>
          ) : null}
        </View>

        <View
          style={[
            styles.formPanel,
            isWide ? styles.formPanelWide : styles.formPanelNarrow,
            !isWide && { paddingBottom: insets.bottom + Spacing.xxxl },
          ]}
        >
          <View style={[styles.card, !isWide && styles.cardNarrow]}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>
            <Text style={styles.cardSubtitle}>Ingresa con tu usuario y contraseña.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[styles.input, usuarioFocused && styles.inputFocused]}
                placeholder="vendedora01"
                placeholderTextColor={PALETTE.placeholder}
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                onFocus={() => setUsuarioFocused(true)}
                onBlur={() => setUsuarioFocused(false)}
                underlineColorAndroid="transparent"
                selectionColor={PALETTE.button}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor={PALETTE.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  underlineColorAndroid="transparent"
                  selectionColor={PALETTE.button}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.showButton}
                  onPress={() => setShowPassword(prev => !prev)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  <Text style={styles.showButtonText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>!</Text>
                </View>
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              activeOpacity={0.8}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.page,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  scrollContentNarrow: {
    flexDirection: 'column',
  },
  infoPanel: {
    backgroundColor: PALETTE.panel,
    justifyContent: 'space-between',
  },
  infoPanelWide: {
    flex: 1,
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  infoPanelNarrow: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: PALETTE.logo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  brandName: {
    color: PALETTE.panelText,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: PALETTE.panelMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  heroWide: {
    width: '100%',
    marginVertical: Spacing.xxxxl,
    maxWidth: 520,
  },
  heroTitle: {
    color: PALETTE.panelText,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroTitleWide: {
    fontSize: 40,
    lineHeight: 48,
  },
  heroText: {
    color: PALETTE.panelBody,
    fontSize: FontSize.md,
    lineHeight: 24,
    marginTop: Spacing.lg,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureText: {
    color: PALETTE.panelBody,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  panelFooter: {
    color: PALETTE.panelMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xxxl,
  },
  formPanel: {
    backgroundColor: PALETTE.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formPanelWide: {
    flex: 1,
    padding: Spacing.xxxl,
  },
  formPanelNarrow: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 32px rgba(15, 43, 78, 0.10)' }
      : Shadows.lg),
  },
  cardNarrow: {
    padding: Spacing.xxl,
  },
  cardTitle: {
    color: PALETTE.heading,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  cardSubtitle: {
    color: PALETTE.subtext,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: PALETTE.label,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  input: {
    height: TouchTarget.comfortable,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: PALETTE.inputText,
    backgroundColor: PALETTE.card,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
  },
  inputFocused: {
    borderColor: PALETTE.button,
  },
  showButton: {
    height: TouchTarget.comfortable,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.card,
  },
  showButtonText: {
    color: PALETTE.label,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: PALETTE.alertBg,
    borderWidth: 1,
    borderColor: PALETTE.alertBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  alertIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PALETTE.alertIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    lineHeight: 14,
  },
  alertText: {
    flex: 1,
    color: PALETTE.alertText,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  submitButton: {
    height: TouchTarget.comfortable,
    borderRadius: BorderRadius.sm,
    backgroundColor: PALETTE.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingVertical: 6,
  },
  forgotText: {
    color: PALETTE.button,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
