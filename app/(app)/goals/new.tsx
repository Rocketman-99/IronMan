import { useState } from 'react';
import { t } from '../../../src/i18n/ko';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/utils/theme';
import { DatePicker } from '../../../src/components/common/DatePicker';
import { useGoalsStore } from '../../../src/stores/goalsStore';
import { RACE_OPTIONS, defaultRaceTitle } from '../../../src/utils/races';
import { type SportType, type GoalType, type GoalPeriod, type RaceType } from '../../../src/types';

const SPORTS: { value: SportType | 'general'; label: string }[] = [
  { value: 'running', label: t.sport.running },
  { value: 'swimming', label: t.sport.swimming },
  { value: 'cycling', label: t.sport.cycling },
];
const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'distance', label: t.goalType.distance },
  { value: 'time', label: t.log.duration },
  { value: 'frequency', label: t.goalType.frequency },
  { value: 'pace', label: t.goalType.pace },
  { value: 'race', label: t.goalTypeRace },
];
const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: 'once', label: t.goalPeriod.once },
  { value: 'weekly', label: t.goalPeriod.weekly },
  { value: 'monthly', label: t.goalPeriod.monthly },
];

export default function NewGoal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { createGoal } = useGoalsStore();

  const [sport, setSport] = useState<SportType | 'general'>('running');
  const [goalType, setGoalType] = useState<GoalType>('distance');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('km');
  const [period, setPeriod] = useState<GoalPeriod>('weekly');
  const [targetDate, setTargetDate] = useState('');
  const [raceType, setRaceType] = useState<RaceType | null>(null);
  const [raceDate, setRaceDate] = useState('');
  const [saving, setSaving] = useState(false);

  const isRace = goalType === 'race';

  async function handleSave() {
    if (isRace) {
      if (!raceType) { Alert.alert(t.common.error, t.goals.needRaceType); return; }
    } else if (!title || !targetValue) {
      Alert.alert(t.common.error, t.goals.needTitleValue); return;
    }

    setSaving(true);
    try {
      if (isRace && raceType) {
        await createGoal(db, {
          sport_type: 'general',
          goal_type: 'race',
          // 제목을 비워두면 레이스 이름으로 채운다.
          title: title || defaultRaceTitle(raceType),
          target_value: 1,
          unit: t.common.countUnit,
          period: 'once',
          race_type: raceType,
          race_date: raceDate || undefined,
        });
      } else {
        await createGoal(db, {
          sport_type: sport,
          goal_type: goalType,
          title,
          target_value: parseFloat(targetValue),
          unit,
          period,
          target_date: targetDate || undefined,
        });
      }
      router.back();
    } finally { setSaving(false); }
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>{t.goals.newTitle}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t.goals.goalType}</Text>
      <View style={styles.chips}>
        {GOAL_TYPES.map(g => (
          <TouchableOpacity key={g.value} style={[styles.chip, goalType === g.value && styles.chipActive]} onPress={() => setGoalType(g.value)}>
            <Text style={[styles.chipText, goalType === g.value && styles.chipTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isRace ? (
        <>
          <Text style={styles.label}>{t.goals.raceKind}</Text>
          {RACE_OPTIONS.map(group => (
            <View key={group.category}>
              <Text style={styles.groupLabel}>{group.category}</Text>
              {group.items.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.raceRow, raceType === r.value && styles.raceRowActive]}
                  onPress={() => setRaceType(r.value)}
                >
                  <View style={styles.raceInfo}>
                    <Text style={[styles.raceLabel, raceType === r.value && styles.raceLabelActive]}>{r.label}</Text>
                    <Text style={styles.raceDetail}>{r.detail}</Text>
                  </View>
                  {raceType === r.value && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <Text style={styles.label}>{t.goals.raceDate}</Text>
          <DatePicker value={raceDate} onChange={setRaceDate} clearable />

          <Text style={styles.label}>{t.goals.goalTitle}</Text>
          <TextInput
            style={styles.input}
            placeholder={raceType ? defaultRaceTitle(raceType) : t.goals.goalTitlePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>{t.goals.sport}</Text>
          <View style={styles.chips}>
            {SPORTS.map(s => (
              <TouchableOpacity key={s.value} style={[styles.chip, sport === s.value && styles.chipActive]} onPress={() => setSport(s.value)}>
                <Text style={[styles.chipText, sport === s.value && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t.goals.goalTitle}</Text>
          <TextInput style={styles.input} placeholder={t.goals.goalTitlePlaceholder} placeholderTextColor={colors.textMuted}
            value={title} onChangeText={setTitle} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>{t.goals.targetValue}</Text>
              <TextInput style={styles.input} placeholder="30" placeholderTextColor={colors.textMuted}
                value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>{t.goals.unit}</Text>
              <TextInput style={styles.input} placeholder="km" placeholderTextColor={colors.textMuted}
                value={unit} onChangeText={setUnit} />
            </View>
          </View>

          <Text style={styles.label}>{t.goals.period}</Text>
          <View style={styles.chips}>
            {PERIODS.map(p => (
              <TouchableOpacity key={p.value} style={[styles.chip, period === p.value && styles.chipActive]} onPress={() => setPeriod(p.value)}>
                <Text style={[styles.chipText, period === p.value && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t.goals.targetDate}</Text>
          <DatePicker value={targetDate} onChange={setTargetDate} clearable />
        </>
      )}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? t.common.saving : t.goals.submit}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 4 },
  backText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  raceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.cardBorder },
  raceRowActive: { borderColor: colors.primary, backgroundColor: colors.card },
  raceInfo: { flex: 1 },
  raceLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  raceLabelActive: { color: colors.text },
  raceDetail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
