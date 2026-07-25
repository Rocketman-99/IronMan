import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { SportSelector } from '../../../src/components/workout/SportSelector';
import { colors } from '../../../src/utils/theme';
import { type SportType } from '../../../src/types';

export default function LogScreen() {
  const router = useRouter();

  function handleSelect(sport: SportType) {
    router.push(`/(app)/log/${sport}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>운동 기록</Text>
        <Text style={styles.subtitle}>오늘 어떤 운동을 하셨나요?</Text>
      </View>
      <SportSelector onSelect={handleSelect} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 15 },
});
