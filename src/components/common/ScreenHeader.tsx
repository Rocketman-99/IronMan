import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../utils/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = false, rightElement }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{rightElement ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 40,
  },
});
