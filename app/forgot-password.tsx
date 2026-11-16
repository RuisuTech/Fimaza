import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows, TouchTarget } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PALETTE = {
  page: '#f4f5f7',
  card: '#ffffff',
  heading: '#0B2545',
  text: '#1f2937',
  textMuted: '#6b7280',
  inputBorder: '#d0d5dd',
  active: '#255bb3',
  success: '#047857',
  successSoft: '#ECFDF5',
  error: '#b91c1c',
  errorSoft: '#FEF2F2',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError('');
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : Linking.createURL('/reset-password');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );
    setLoading(false);

    if (resetError) {
      setError('No se pudo enviar el correo. Revisa el email o intenta más tarde.');
      return;
    }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={28} color={PALETTE.active} />
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un enlace para que puedas crear una nueva contraseña.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color={PALETTE.success} />
              <Text style={styles.successText}>
                Revisa tu correo. Si no llega en unos minutos, revisa spam.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="usuario@fimaza.com"
                placeholderTextColor={PALETTE.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
                selectionColor={PALETTE.active}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Enviar enlace</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backButton}>
            <Text style={styles.backText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.page },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl,
    ...Shadows.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: PALETTE.heading,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  label: {
    color: PALETTE.text,
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
    color: PALETTE.text,
    backgroundColor: PALETTE.card,
  },
  errorText: {
    color: PALETTE.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  button: {
    height: TouchTarget.comfortable,
    borderRadius: BorderRadius.sm,
    backgroundColor: PALETTE.active,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: PALETTE.successSoft,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  successText: {
    flex: 1,
    color: PALETTE.success,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
    paddingVertical: 6,
  },
  backText: {
    color: PALETTE.active,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
