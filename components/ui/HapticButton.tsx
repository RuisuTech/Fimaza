import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TouchTarget } from '@/constants/theme';

interface HapticButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

export const HapticButton = React.memo<HapticButtonProps>(({
  onPress,
  children,
  style,
  disabled = false,
  hapticType = 'light',
}) => {
  const handlePress = useCallback(() => {
    if (disabled) return;
    
    const hapticMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
      selection: Haptics.ImpactFeedbackStyle.Light,
    };

    if (hapticType === 'selection') {
      Haptics.selectionAsync();
    } else {
      Haptics.impactAsync(hapticMap[hapticType]);
    }
    
    onPress();
  }, [onPress, disabled, hapticType]);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityRole="button"
    >
      {children}
    </TouchableOpacity>
  );
});

HapticButton.displayName = 'HapticButton';

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
