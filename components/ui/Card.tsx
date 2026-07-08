import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = React.memo<CardProps>(({
  children,
  style,
  variant = 'default',
}) => {
  const variantStyles = {
    default: [styles.card, Shadows.sm],
    elevated: [styles.card, Shadows.md],
    outlined: [styles.card, styles.outlined],
  };

  return (
    <View style={[...variantStyles[variant], style]}>
      {children}
    </View>
  );
});

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
});
