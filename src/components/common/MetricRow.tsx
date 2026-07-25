import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';

interface MetricRowProps {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}

export function MetricRow({ label, value, subValue, color }: MetricRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        <Text style={[styles.value, color ? { color } : undefined]}>{value}</Text>
        {subValue && <Text style={styles.subValue}>{subValue}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subValue: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
