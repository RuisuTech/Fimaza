import React, { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  flex: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  minWidth?: number;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  minWidth = 640,
  emptyText = 'Sin registros',
}: DataTableProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.table, { minWidth }]}>
        <View style={styles.header}>
          {columns.map(column => (
            <Text
              key={column.key}
              style={[
                styles.th,
                { flex: column.flex, textAlign: column.align ?? 'left' },
              ]}
              numberOfLines={1}
            >
              {column.label}
            </Text>
          ))}
        </View>

        {rows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          rows.map((row, index) => (
            <View key={keyExtractor(row, index)} style={styles.row}>
              {columns.map(column => (
                <View
                  key={column.key}
                  style={[
                    styles.td,
                    { flex: column.flex },
                    column.align === 'center' && styles.alignCenter,
                    column.align === 'right' && styles.alignRight,
                  ]}
                >
                  {column.render(row, index)}
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: ADMIN.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: ADMIN.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FB',
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.border,
  },
  th: {
    color: '#334155',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.rowBorder,
    backgroundColor: ADMIN.card,
  },
  td: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
  },
});
