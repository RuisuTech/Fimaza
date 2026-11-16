import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ADMIN, ADMIN_SHADOW } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';

export interface SelectOption<T extends string | number> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string | number> {
  label?: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  compact = false,
  style,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.select,
          compact && styles.selectCompact,
          disabled && styles.selectDisabled,
        ]}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.selectText,
            compact && styles.selectTextCompact,
            !selected && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={compact ? 14 : 16}
          color={ADMIN.textMuted}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.menu}>
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              {options.length === 0 ? (
                <Text style={styles.emptyText}>Sin opciones disponibles</Text>
              ) : (
                options.map(option => {
                  const isSelected = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color={ADMIN.active} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 0,
  },
  label: {
    color: ADMIN.text,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  select: {
    height: 44,
    borderWidth: 1,
    borderColor: ADMIN.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ADMIN.card,
    gap: 8,
  },
  selectCompact: {
    height: 34,
    paddingHorizontal: 8,
  },
  selectDisabled: {
    backgroundColor: ADMIN.graySoft,
    opacity: 0.8,
  },
  selectText: {
    flex: 1,
    color: ADMIN.text,
    fontSize: FontSize.sm,
  },
  selectTextCompact: {
    fontSize: 12,
  },
  placeholder: {
    color: ADMIN.textSoft,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 37, 69, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: ADMIN.card,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    ...ADMIN_SHADOW,
  },
  menuScroll: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: ADMIN.activeSoft,
  },
  optionText: {
    flex: 1,
    color: ADMIN.text,
    fontSize: FontSize.sm,
  },
  optionTextSelected: {
    color: ADMIN.active,
    fontWeight: FontWeight.semibold,
  },
  emptyText: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
    paddingHorizontal: 16,
    paddingVertical: 20,
    textAlign: 'center',
  },
});
