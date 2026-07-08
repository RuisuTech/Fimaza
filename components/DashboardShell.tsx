import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import Sidebar from '@/components/Sidebar';
import type { NavItem } from '@/components/Sidebar';
import { Colors } from '@/constants/theme';

interface DashboardShellProps {
  items: NavItem[];
  accentColor?: string;
}

export default function DashboardShell({ items, accentColor }: DashboardShellProps) {
  return (
    <View style={styles.container}>
      <Sidebar items={items} accentColor={accentColor} />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
  },
});
