import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../src/stores/profileStore';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/theme';
import { FITNESS_LEVELS } from '../../src/utils/constants';
import { type FitnessLevel } from '../../src/types';

export default function FitnessLevelScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile } = useProfileStore();
  const [level, setLevel] = useState<FitnessLevel | null>(null);
  const [weeklyHours, setWeeklyHours] = useState('5');
  const [restingHR, setRestingHR] = useState('');
  const [maxHR, setMaxHR] = useState('');

  async function handleNext() {
    if (!level) return;
    await saveProfile(db, {
      fitness_level: level,
      weekly_hours: parseFloat(weeklyHours) || 5,
      resting_hr: restingHR ? parseInt(restingHR) : undefined,
      max_hr: maxHR ? parseInt(maxHR) : undefined,
    });
    router.push('/(onboarding)/race-goals');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>현재 피트니스 레벨</Text>
        <Text style={styles.subtitle}>솔직하게 선택해주세요. 맞춤 훈련에 활용됩니다.</Text>

        {FITNESS_LEVELS.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.levelCard, level === l.value && styles.levelCardActive]}
            onPress={() => setLevel(l.value as FitnessLevel)}
            activeOpacity={0.7}
          >
            <Text style={[styles.levelLabel, level === l.value && styles.levelLabelActive]}>
              {l.label}
            </Text>
            <Text style={styles.levelDesc}>{l.description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>주간 훈련 가능 시간 (시간)</Text>
        <TextInput
          style={styles.input}
          value={weeklyHours}
          onChangeText={setWeeklyHours}
          keyboardType="decimal-pad"
          placeholder="5"
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>안정시 심박수 (선택)</Text>
            <TextInput
              style={styles.input}
              value={restingHR}
              onChangeText={setRestingHR}
              placeholder="60"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>최대 심박수 (선택)</Text>
            <TextInput
              style={styles.input}
              value={maxHR}
              onChangeText={setMaxHR}
              placeholder="190"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.buttons}>
          <Button label="이전" variant="secondary" onPress={() => router.back()} style={styles.btnHalf} />
          <Button label="다음" onPress={handleNext} disabled={!level} style={styles.btnHalf} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 28 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 40, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 24 },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  levelCardActive: { borderColor: colors.primary },
  levelLabel: { color: colors.textSecondary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  levelLabelActive: { color: colors.primaryLight },
  levelDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 40, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  buttons: { flexDirection: 'row', gap: 12 },
  btnHalf: { flex: 1, borderRadius: 14 },
});
