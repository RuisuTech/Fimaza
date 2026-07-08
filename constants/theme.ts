import { Platform } from 'react-native';

export type ColorSet = typeof Colors.light;

export const Colors = {
  light: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2563EB',
    accentLight: '#EFF6FF',
    accentDark: '#1D4ED8',
    accentMuted: '#BFDBFE',
    success: '#059669',
    successLight: '#ECFDF5',
    successMuted: '#A7F3D0',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    warningMuted: '#FDE68A',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
    dangerMuted: '#FECACA',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.4)',
    cardShadow: 'rgba(0, 0, 0, 0.04)',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    accent: '#3B82F6',
    accentLight: '#1E3A5F',
    accentDark: '#60A5FA',
    accentMuted: '#1E40AF',
    success: '#10B981',
    successLight: '#064E3B',
    successMuted: '#065F46',
    warning: '#F59E0B',
    warningLight: '#78350F',
    warningMuted: '#92400E',
    danger: '#EF4444',
    dangerLight: '#7F1D1D',
    dangerMuted: '#991B1B',
    border: '#334155',
    borderLight: '#1E293B',
    divider: '#1E293B',
    overlay: 'rgba(0, 0, 0, 0.6)',
    cardShadow: 'rgba(0, 0, 0, 0.2)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TouchTarget = {
  minimum: 44,
  comfortable: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadows = Platform.select({
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
  },
  android: {
    sm: { elevation: 1 },
    md: { elevation: 3 },
    lg: { elevation: 6 },
  },
  default: {
    sm: {},
    md: {},
    lg: {},
  },
});
