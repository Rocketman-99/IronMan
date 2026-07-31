import { useState } from 'react';
import { t } from '../../src/i18n/ko';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../src/utils/theme';
import { DatePicker } from '../../src/components/common/DatePicker';
import { useProfileStore } from '../../src/stores/profileStore';
import { useGoalsStore } from '../../src/stores/goalsStore';
import { RACE_OPTIONS, defaultRaceTitle } from '../../src/utils/races';
import { type RaceType } from '../../src/types';

export default function RaceGoals() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { completeOnboarding } = useProfileStore();
  const { createGoal } = useGoalsStore();
  const [raceType, setRaceType] = useState<RaceType | null>(null);
  const [targetDate, setTargetDate] = useState('');

  /**
   * 레이스는 프로필이 아니라 목표로 저장한다. 목표 탭에서 여러 개를 각자
   * 다른 날짜로 관리할 수 있고, 여기서 고른 건 그중 첫 번째가 된다.
   */
  async function finish(withRace: boolean) {
    if (withRace && raceType) {
      await createGoal(db, {
        sport_type: 'general',
        goal_type: 'race',
        title: defaultRaceTitle(raceType),
        target_value: 1,
        unit: t.common.countUnit,
        period: 'once',
        race_type: raceType,
        race_date: targetDate || undefined,
      });
    }
    await completeOnboarding(db);
    router.replace('/(app)');
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <Text style={styles.step}>4 / 4</Text>
      <Text style={styles.title}>{t.profile.goalRace}</Text>
      <Text style={styles.subtitle}>{t.onboarding.raceTitle}</Text>

      {RACE_OPTIONS.map(group => (
        <View key={group.category}>
          <Text style={styles.groupLabel}>{group.category}</Text>
          <View style={styles.raceList}>
            {group.items.map(rt => (
              <TouchableOpacity
                key={rt.value}
                style={[styles.raceCard, raceType === rt.value && styles.raceCardActive]}
                onPress={() => setRaceType(rt.value)}
              >
                <Text style={[styles.raceName, raceType === rt.value && styles.raceNameActive]}>{rt.label}</Text>
                <Text style={styles.raceDesc}>{rt.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.label}>{t.onboarding.raceDate}</Text>
      <DatePicker value={targetDate} onChange={setTargetDate} clearable />

      <TouchableOpacity
        style={[styles.btn, !raceType && styles.btnDisabled]}
        onPress={() => finish(true)}
        disabled={!raceType}
      >
        <Text style={styles.btnText}>{t.onboarding.finish}</Text>
      </TouchableOpacity>

      {/* 레이스를 정하지 않았어도 앱은 쓸 수 있어야 한다. */}
      <TouchableOpacity style={styles.skipBtn} onPress={() => finish(false)}>
        <Text style={styles.skipText}>{t.common.skip}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  step: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  raceList: { gap: 8 },
  raceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.cardBorder },
  raceCardActive: { borderColor: colors.primary, borderWidth: 2 },
  raceName: { color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 2 },
  raceNameActive: { color: colors.primary },
  raceDesc: { color: colors.textSecondary, fontSize: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 24 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { padding: 14, alignItems: 'center', marginTop: 4 },
  skipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
