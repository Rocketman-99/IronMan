import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, feelingEmojis } from '../../utils/theme';
import { t, feelingLabels } from '../../i18n/ko';

interface FeelingSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function FeelingSelector({ value, onChange }: FeelingSelectorProps) {
  return (
    <View>
      <Text style={styles.title}>{t.log.feelingPrompt}</Text>
      <View style={styles.row}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.item, value === n && styles.selected]}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{feelingEmojis[n]}</Text>
            <Text style={[styles.label, value === n && styles.labelSelected]}>
              {feelingLabels[n]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.text,
  },
});
