import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function AlertModal({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
}: AlertModalProps) {
  const C = useThemeColors();

  const CONFIG: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
    success: { icon: 'checkmark-circle', color: C.success, bgColor: C.successLight },
    error: { icon: 'close-circle', color: C.danger, bgColor: C.dangerLight },
    warning: { icon: 'warning', color: C.warning, bgColor: C.warningLight },
    info: { icon: 'information-circle', color: C.accent, bgColor: C.accentLight },
  };

  const config = CONFIG[type];

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    (onConfirm || onClose)();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
        <View style={[styles.modal, { backgroundColor: C.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={36} color={config.color} />
          </View>

          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <Text style={[styles.message, { color: C.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: C.border, backgroundColor: C.surface }]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: C.textSecondary }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: config.color }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minimum,
  },
  cancelText: {
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minimum,
  },
  confirmText: {
    color: '#fff',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});
