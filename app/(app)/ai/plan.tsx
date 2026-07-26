import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/utils/theme';
import { useAIStore } from '../../../src/stores/aiStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';

export default function TrainingPlan() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { trainingPlan, generatePlan, isLoading } = useAIStore();
  const { profile } = useProfileStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();
  const [expanded, setExpanded] = useState<number | null>(null);

  async function handleGenerate() {
    if (!checkAndIncrementAIUsage('sonnet')) return;
    await generatePlan(db, profile);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>훈련 계획</Text>
      </TouchableOpacity>

      {!trainingPlan ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>AI 맞이춤 훈련 계획</Text>
          <Text style={styles.emptyText}>프로필과 최근 운동 데이터를 분석하여\n4주 훈련 계획을 생성합니다</Text>
          {!hasApiKey ? (
            <TouchableOpacity onPress={() => router.push('/(app)/settings')} style={styles.btn}>
              <Text style={styles.btnText}>API 키 설정하기</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={handleGenerate} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>계획 생성하기</Text>}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.planTitle}>{trainingPlan.title}</Text>
          <Text style={styles.planOverview}>{trainingPlan.overview}</Text>
          {trainingPlan.weeks?.map((week: any, idx: number) => (
            <TouchableOpacity key={idx} style={styles.weekCard} onPress={() => setExpanded(expanded === idx ? null : idx)}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>{week.week_label ?? `${idx + 1}주차`}</Text>
                <Ionicons name={expanded === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.weekFocus}>{week.focus}</Text>
              {expanded === idx && week.sessions?.map((s: any, si: number) => (
                <View key={si} style={styles.session}>
                  <Text style={styles.sessionDay}>{s.day}</Text>
                  <Text style={styles.sessionDesc}>{s.description}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.retryBtn} onPress={handleGenerate} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.retryBtnText}>다시 생성</Text>}
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
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  planTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  planOverview: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
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
