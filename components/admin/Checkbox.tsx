import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ADMIN } from '@/constants/adminTheme';

export default function Checkbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.box}
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? ADMIN.active : ADMIN.textSoft}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
