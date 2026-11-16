import React, { useEffect, useState } from 'react';
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
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));
      setReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
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
            <Ionicons name="key-outline" size={28} color={PALETTE.active} />
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Define una contraseña segura para tu cuenta.</Text>

          {!ready ? (
            <ActivityIndicator color={PALETTE.active} />
          ) : done ? (
            <>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color={PALETTE.success} />
                <Text style={styles.successText}>Contraseña actualizada correctamente.</Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Ir al inicio de sesión</Text>
              </TouchableOpacity>
            </>
          ) : !hasSession ? (
            <>
              <Text style={styles.errorText}>
                El enlace es inválido o expiró. Solicita uno nuevo.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/forgot-password')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Solicitar nuevo enlace</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={PALETTE.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
                selectionColor={PALETTE.active}
              />
              <Text style={[styles.label, styles.secondLabel]}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repite la contraseña"
                placeholderTextColor={PALETTE.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
                selectionColor={PALETTE.active}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Guardar contraseña</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
  secondLabel: { marginTop: Spacing.lg },
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
    lineHeight: 19,
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
});
