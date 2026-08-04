import { useState } from 'react';
import { t } from '../../src/i18n/ko';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/utils/theme';
import { useAIStore } from '../../src/stores/aiStore';
import { ConsiderationList, GeneratingIndicator, ContextSummary } from '../../src/components/ai/AIProgress';
import { PLAN_CONSIDERATIONS } from '../../src/services/ai/considerations';
import { useProfileStore } from '../../src/stores/profileStore';
import { useAppStore } from '../../src/stores/appStore';
import { ALL_SPORTS, parseFocus } from '../../src/services/ai/context';
import { type SportType } from '../../src/types';

export default function TrainingPlan() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { trainingPlan, generatePlan, isLoading, progressChars, startedAt, lastContext } = useAIStore();
  const { profile, saveProfile } = useProfileStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  /** 지난번에 고른 종목을 그대로 띄운다. 저장된 게 없으면 3종 전부. */
  const [focus, setFocus] = useState<SportType[]>(() => parseFocus(profile?.plan_focus_sports));

  function toggleSport(sport: SportType) {
    const next = focus.includes(sport)
      ? focus.filter((s) => s !== sport)
      // 켤 때는 ALL_SPORTS 순서로 다시 세워 러닝·수영·사이클 순서를 유지한다.
      : ALL_SPORTS.filter((s) => focus.includes(s) || s === sport);
    // 전부 끄면 계획을 만들 수 없다. 마지막 하나는 못 끄게 한다.
    if (next.length === 0) return;
    setFocus(next);
  }

  async function handleGenerate() {
    if (!checkAndIncrementAIUsage('deep')) return;
    // 다음에 열었을 때 다시 고르지 않도록 남긴다.
    if (focus.join(',') !== (profile?.plan_focus_sports ?? '')) {
      await saveProfile(db, { plan_focus_sports: focus.join(',') });
    }
    await generatePlan(db, profile, focus);
  }

  function SportFocus() {
    return (
      <View style={styles.focusBlock}>
        <Text style={styles.focusLabel}>{t.ai.focusLabel}</Text>
        <View style={styles.focusChips}>
          {ALL_SPORTS.map((s) => {
            const on = focus.includes(s);
            return (
              <TouchableOpacity
                key={s}
                style={[styles.focusChip, on && styles.focusChipOn]}
                onPress={() => toggleSport(s)}
              >
                <Text style={[styles.focusChipText, on && styles.focusChipTextOn]}>{t.sport[s]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.focusHint}>{t.ai.focusHint}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>{t.ai.planTitle}</Text>
      </TouchableOpacity>

      {!trainingPlan ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t.ai.planEmpty}</Text>
          <Text style={styles.emptyText}>{t.aiContext.willConsider}</Text>
          <ConsiderationList items={PLAN_CONSIDERATIONS} />
          <SportFocus />
          {!hasApiKey ? (
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.btn}>
              <Text style={styles.btnText}>{t.dashboard.setupApiKeyBtn}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.btn} onPress={handleGenerate} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.ai.planGenerate}</Text>}
              </TouchableOpacity>
              {isLoading && <GeneratingIndicator startedAt={startedAt} progressChars={progressChars} />}
            </>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.planTitle}>{trainingPlan.title}</Text>
          {trainingPlan.weeks?.map((week, idx) => (
            <TouchableOpacity key={idx} style={styles.weekCard} onPress={() => setExpanded(expanded === idx ? null : idx)}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>{t.ai.weekLabel.replace('{n}', String(week.weekNumber))}</Text>
                <Ionicons name={expanded === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.weekFocus}>{week.focus}</Text>
              {expanded === idx && week.sessions?.map((s, si) => (
                <View key={si} style={styles.session}>
                  <Text style={styles.sessionDay}>{s.day} • {s.sport} • {s.duration}</Text>
                  <Text style={styles.sessionDesc}>{s.description}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
          <ContextSummary context={lastContext} />
          {isLoading && <GeneratingIndicator startedAt={startedAt} progressChars={progressChars} />}
          {/* 다시 만들 때 종목을 바꿀 수 있어야 한다. */}
          <SportFocus />
          <TouchableOpacity style={styles.retryBtn} onPress={handleGenerate} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.retryBtnText}>{t.ai.planRegenerate}</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 4 },
  backText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 32, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  focusBlock: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: colors.cardBorder },
  focusLabel: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  focusChips: { flexDirection: 'row', gap: 8 },
  focusChip: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface, alignItems: 'center' },
  focusChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  focusChipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  focusChipTextOn: { color: '#fff' },
  focusHint: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  planTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  weekCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  weekTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  weekFocus: { color: colors.textSecondary, fontSize: 13 },
  session: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider },
  sessionDay: { color: colors.primary, fontWeight: '600', fontSize: 13, marginBottom: 2 },
  sessionDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  retryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  retryBtnText: { color: colors.primary, fontWeight: '700' },
});
