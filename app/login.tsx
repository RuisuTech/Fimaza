import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows, TouchTarget } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const { log } = useActivity();
  const insets = useSafeAreaInsets();
  const C = useThemeColors();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email.trim(), password);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || t('login.loginError'));
    } else if (result.user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      log(result.user.id, 'LOGIN', `${t('login.loggedInAs')} ${result.user.role}`);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: C.accentLight, borderColor: C.accentMuted }]}>
            <Ionicons name="lock-closed" size={32} color={C.accent} />
          </View>
          <Text style={[styles.title, { color: C.text }]}>{t('login.welcomeBack')}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('login.enterCredentials')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: C.text }]}>{t('login.email')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: emailFocused ? C.accent : C.border }]}> 
              <Ionicons name="mail-outline" size={20} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                underlineColorAndroid="transparent"
                selectionColor={C.accent}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: C.text }]}>{t('login.password')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: passwordFocused ? C.accent : C.border }]}> 
              <Ionicons name="lock-closed-outline" size={20} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text, borderWidth: 0, backgroundColor: 'transparent' }, Platform.OS === 'web' ? { outline: 'none', appearance: 'none' } : null]}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                underlineColorAndroid="transparent"
                selectionColor={C.accent}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: C.dangerLight }]}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled, { backgroundColor: C.accent }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>{t('login.signIn')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.credentials, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.credentialsHeader}>
            <Ionicons name="information-circle" size={16} color={C.accent} />
            <Text style={[styles.credentialsTitle, { color: C.accent }]}>{t('login.testCredentials')}</Text>
          </View>
          <View style={styles.credentialRow}>
            <View style={[styles.credentialBadge, { backgroundColor: C.accentLight }]}>
              <Text style={[styles.credentialRole, { color: C.accent }]}>Admin</Text>
            </View>
            <Text style={[styles.credentialText, { color: C.textSecondary }]}>admin@inventario.com / admin123</Text>
          </View>
          <View style={styles.credentialRow}>
            <View style={[styles.credentialBadge, { backgroundColor: C.successLight }]}>
              <Text style={[styles.credentialRole, { color: C.success }]}>User</Text>
            </View>
            <Text style={[styles.credentialText, { color: C.textSecondary }]}>user@inventario.com / user123</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const FORM_MAX_WIDTH = 420;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxxxl,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: TouchTarget.comfortable,
    fontSize: FontSize.md,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  eyeButton: {
    width: TouchTarget.minimum,
    height: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  loginButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  credentials: {
    marginTop: Spacing.xxxxl,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  credentialsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  credentialBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  credentialRole: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  credentialText: {
    fontSize: FontSize.sm,
  },
});
