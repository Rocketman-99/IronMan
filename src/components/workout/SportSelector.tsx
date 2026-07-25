import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors, sportLabels } from '../../utils/theme';
import { type SportType } from '../../types';

interface SportSelectorProps {
  onSelect: (sport: SportType) => void;
}

const SPORTS: Array<{
  type: SportType;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
}> = [
  { type: 'running', icon: 'fitness-outline', emoji: '🏃' },
  { type: 'swimming', icon: 'water-outline', emoji: '🂠' },
  { type: 'cycling', icon: 'bicycle-outline', emoji: '🚴' },
];

export function SportSelector({ onSelect }: SportSelectorProps) {
  return (
    <View style={styles.container}>
      {SPORTS.map((sport) => (
        <TouchableOpacity
          key={sport.type}
          style={[styles.card, { borderColor: sportColors[sport.type] }]}
          onPress={() => onSelect(sport.type)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{sport.emoji}</Text>
          <Ionicons
            name={sport.icon}
            size={32}
            color={sportColors[sport.type]}
            style={styles.icon}
          />
          <Text style={[styles.label, { color: sportColors[sport.type] }]}>
            {sportLabels[sport.type]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
