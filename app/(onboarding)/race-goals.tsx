import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../src/stores/profileStore';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/theme';
import { RACE_TYPES } from '../../src/utils/constants';
import { type RaceType } from '../../src/types';

export default function RaceGoals() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { saveProfile, completeOnboarding } = useProfileStore();
  const [raceType, setRaceType] = useState<RaceType | null>(null);

  async function handleFinish() {
    if (raceType) {
      await saveProfile(db, { primary_goal: raceType });
    }
    await completeOnboarding(db);
    router.replace('/(app)');
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>목표 레이스</Text>
      <Text style={styles.subtitle}>어떤 레이스를 목표로 훈련하시나요?{' '}나중에 변경할 수 있습니다.</Text>

      {RACE_TYPES.map((r) => (
        <TouchableOpacity
          key={r.value}
          style={[styles.card, raceType === r.value && styles.cardActive]}
          onPress={() => setRaceType(r.value as RaceType)}
          activeOpacity={0.7}
        >
          <Text style={[styles.cardLabel, raceType === r.value && styles.cardLabelActive]}>
            {r.label}
          </Text>
          <Text style={styles.cardDetail}>{r.detail}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
        <Text style={styles.skipText}>목표 레이스 없이 시작하기</Text>
      </TouchableOpacity>

      <View style={styles.progress}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.buttons}>
        <Button label="이전" variant="secondary" onPress={() => router.back()} style={styles.btnHalf} />
        <Button label="시작하기 🚀" onPress={handleFinish} style={styles.btnHalf} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 28 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 40, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: { borderColor: colors.primary, backgroundColor: '#1A0A0A' },
  cardLabel: { color: colors.textSecondary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardLabelActive: { color: colors.primaryLight },
  cardDetail: { color: colors.textMuted, fontSize: 13 },
  skipBtn: { alignItems: 'center', paddingVertical: 16 },
  skipText: { color: colors.textSecondary, fontSize: 14 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  buttons: { flexDirection: 'row', gap: 12 },
  btnHalf: { flex: 1, borderRadius: 14 },
});
