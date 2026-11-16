import { Platform } from 'react-native';
import { Shadows } from '@/constants/theme';

export const ADMIN = {
  page: '#f4f5f7',
  card: '#ffffff',
  cardHeader: '#f8fafc',
  border: '#D5DCE6',
  rowBorder: '#E8EDF3',
  heading: '#0B2545',
  text: '#1f2937',
  textMuted: '#6b7280',
  textSoft: '#94a3b8',
  active: '#255bb3',
  activeSoft: '#EFF6FF',
  success: '#047857',
  successSoft: '#ECFDF5',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  info: '#1D4ED8',
  infoSoft: '#EFF6FF',
  graySoft: '#F1F5F9',
  grayText: '#475569',
  white: '#ffffff',
};

export const ADMIN_SHADOW =
  Platform.OS === 'web'
    ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
    : Shadows.sm;
