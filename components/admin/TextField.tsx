import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  editable?: boolean;
  prefix?: string;
  multiline?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  compact?: boolean;
  helpText?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  prefix,
  multiline = false,
  maxLength,
  secureTextEntry,
  autoCapitalize = 'sentences',
  autoCorrect = false,
  compact = false,
  helpText,
  style,
  inputStyle,
}: TextFieldProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          compact && styles.inputRowCompact,
          !editable && styles.inputDisabled,
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[
            styles.input,
            compact && styles.inputCompact,
            multiline && styles.inputMultiline,
            !editable && styles.textDisabled,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ADMIN.textSoft}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          underlineColorAndroid="transparent"
          selectionColor={ADMIN.active}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {helpText ? <Text style={styles.helpText}>{helpText}</Text> : null}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: ADMIN.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: ADMIN.card,
    paddingHorizontal: 12,
    gap: 6,
  },
  inputRowCompact: {
    height: 34,
    paddingHorizontal: 8,
  },
  inputDisabled: {
    backgroundColor: ADMIN.graySoft,
  },
  prefix: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.sm,
    color: ADMIN.text,
    padding: 0,
  },
  inputCompact: {
    fontSize: 12,
  },
  inputMultiline: {
    height: 96,
    paddingTop: 10,
    paddingBottom: 10,
  },
  textDisabled: {
    color: ADMIN.textMuted,
  },
  helpText: {
    color: ADMIN.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
