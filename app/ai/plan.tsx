import { useState } from 'react';
import { t } from '../../src/i18n/ko';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
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
import { formatDateTimeKST } from '../../src/utils/formatters';
import { type StoredPlan } from '../../src/db/queries/trainingPlans';
import { type SportType } from '../../src/types';

export default function TrainingPlan() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { plans, generatePlan, removePlan, isLoading, progressChars, startedAt } = useAIStore();
  const { profile, saveProfile } = useProfileStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();
  /** 펼친 계획의 id. 계획이 여러 개라 인덱스가 아니라 id 로 잡는다. */
  const [openPlan, setOpenPlan] = useState<number | null>(null);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  /** 계획이 있어도 새로 만들 수 있게 하는 토글 */
  const [creating, setCreating] = useState(false);
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
    if (!checkAndIncrementAIUsage('deep', db)) return;
    // 다음에 열었을 때 다시 고르지 않도록 남긴다.
    if (focus.join(',') !== (profile?.plan_focus_sports ?? '')) {
      await saveProfile(db, { plan_focus_sports: focus.join(',') });
    }
    await generatePlan(db, profile, focus);
    setCreating(false);
  }

  function handleDelete(plan: StoredPlan) {
    Alert.alert(t.ai.planDeleteTitle, t.ai.planDeleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => removePlan(db, plan.id) },
    ]);
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

      {plans.length === 0 || creating ? (
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
          {creating && !isLoading && (
            <TouchableOpacity onPress={() => setCreating(false)}>
              <Text style={styles.cancelText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.newBtn} onPress={() => setCreating(true)}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.newBtnText}>{t.ai.planNew}</Text>
          </TouchableOpacity>

          {plans.map((stored) => {
            const open = openPlan === stored.id;
            return (
              <View key={stored.id} style={styles.planCard}>
                <TouchableOpacity
                  style={styles.planHeader}
                  onPress={() => setOpenPlan(open ? null : stored.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{stored.plan.title}</Text>
                    {/* 생성일을 같이 보여줘야 어느 시점의 계획인지 알 수 있다. */}
                    <Text style={styles.planMeta}>
                      {formatDateTimeKST(new Date(stored.createdAt))}
                      {stored.focusSports
                        ? ` · ${stored.focusSports.split(',').map((sp) => t.sport[sp as SportType] ?? sp).join(', ')}`
                        : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(stored)}
                    style={styles.trashBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {open && (
                  <>
                    {stored.plan.weeks?.map((week, idx) => {
                      const weekKey = `${stored.id}-${idx}`;
                      return (
                        <TouchableOpacity
                          key={weekKey}
                          style={styles.weekCard}
                          onPress={() => setOpenWeek(openWeek === weekKey ? null : weekKey)}
                        >
                          <View style={styles.weekHeader}>
                            <Text style={styles.weekTitle}>{t.ai.weekLabel.replace('{n}', String(week.weekNumber))}</Text>
                            <Ionicons name={openWeek === weekKey ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                          </View>
                          <Text style={styles.weekFocus}>{week.focus}</Text>
                          {openWeek === weekKey && week.sessions?.map((sess, si) => (
                            <View key={si} style={styles.session}>
                              <Text style={styles.sessionDay}>{sess.day} • {sess.sport} • {sess.duration}</Text>
                              <Text style={styles.sessionDesc}>{sess.description}</Text>
                            </View>
                          ))}
                        </TouchableOpacity>
                      );
                    })}
                    {stored.considered && <ConsiderationList items={stored.considered} />}
                  </>
                )}
              </View>
            );
          })}
          {isLoading && <GeneratingIndicator startedAt={startedAt} progressChars={progressChars} />}
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
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 16 },
  newBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  cancelText: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  planCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planInfo: { flex: 1 },
  planMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  trashBtn: { padding: 4 },
  planTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
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
