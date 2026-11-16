import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost';
type ButtonSize = 'md' | 'sm';

interface AdminButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<ButtonVariant, { background: string; border: string; text: string }> = {
  primary: { background: ADMIN.active, border: ADMIN.active, text: ADMIN.white },
  secondary: { background: ADMIN.card, border: ADMIN.border, text: ADMIN.text },
  dark: { background: ADMIN.heading, border: ADMIN.heading, text: ADMIN.white },
  danger: { background: ADMIN.dangerSoft, border: ADMIN.dangerSoft, text: ADMIN.danger },
  ghost: { background: 'transparent', border: 'transparent', text: ADMIN.active },
};

export default function AdminButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  style,
}: AdminButtonProps) {
  const tone = VARIANTS[variant];
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
          height: isSmall ? 34 : 44,
          paddingHorizontal: isSmall ? 10 : 14,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      accessibilityRole="button"
    >
      {icon ? <Ionicons name={icon} size={isSmall ? 15 : 17} color={tone.text} /> : null}
      <Text style={[styles.label, { color: tone.text, fontSize: isSmall ? 11 : FontSize.sm }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontWeight: FontWeight.bold,
  },
});
