import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';
import { getAIClient } from '../../../src/services/ai/client';
import { getRecentWorkouts } from '../../../src/db/queries/workouts';
import { buildCoachSystemPrompt } from '../../../src/services/ai/prompts';
import { AI_MODELS } from '../../../src/config/api';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { Card } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import { colors, raceTypeLabels } from '../../../src/utils/theme';
import { type RaceType } from '../../../src/types';

type WeekPlan = { week: number; theme: string; sessions: Array<{ day: string; sport: string; description: string; duration: string }>; totalHours: string; notes: string; };
type TrainingPlan = { title: string; duration: string; overview: string; weeks: WeekPlan[]; tips: string[]; };

export default function PlanScreen() {
  const db = useSQLiteContext();
  const { profile } = useProfileStore();
  const { checkAndIncrementAIUsage } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  async function handleGenerate() {
    if (!checkAndIncrementAIUsage(2)) { Alert.alert('한도 초과', '오늘의 AI 사용 한도에 도달했습니다.'); return; }
    if (!profile) { Alert.alert('프로필 필요', '먼저 프로필을 설정해주세요.'); return; }
    setLoading(true);
    try {
      const client = await getAIClient();
      const workouts = await getRecentWorkouts(db, 14);
      const raceLabel = profile.primary_goal ? raceTypeLabels[profile.primary_goal as RaceType] ?? profile.primary_goal : '트라이애슬론';
      const prompt = `사용자의 현재 훈련 상태와 목표를 바탕으로 4주 훈련 계획을 만들어주세요.
목표 레이스: ${raceLabel}
${profile.target_race_date ? `목표 레이스 날짜: ${profile.target_race_date}` : ''}
주간 가능 시간: ${profile.weekly_hours ?? 5}시간

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "훈련 계획 제목",
  "duration": "4주",
  "overview": "전체 계획 개요 2-3문장",
  "weeks": [
    {
      "week": 1,
      "theme": "주차 테마",
      "sessions": [
        { "day": "월요일", "sport": "러닝", "description": "세션 설명", "duration": "45분" }
      ],
      "totalHours": "예상 총 시간",
      "notes": "주차 특이사항"
    }
  ],
  "tips": ["팁1", "팁2", "팁3"]
}`;
      const response = await client.messages.create({ model: AI_MODELS.sonnet, max_tokens: 2500, system: buildCoachSystemPrompt(profile, workouts), messages: [{ role: 'user', content: prompt }] });
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');
      setPlan(JSON.parse(jsonMatch[0]) as TrainingPlan);
      setExpandedWeek(0);
    } catch { Alert.alert('오류', '훈련 계획 생성 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="훈련 계획" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {!plan && !loading && (
          <View style={styles.intro}>
            <Text style={styles.introIcon}>📋</Text>
            <Text style={styles.introTitle}>맞츤 훈련 계획</Text>
            <Text style={styles.introText}>프로필과 최근 운동 데이터를 분석하여{'
'}나만의 4주 훈련 계획을 생성합니다.</Text>
            <Button label="계획 생성하기" onPress={handleGenerate} style={styles.startBtn} />
          </View>
        )}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>AI가 맞츤 훈련 계획을 작성 중...</Text>
            <Text style={styles.loadingSubtext}>약 15~20초 소요됩니다</Text>
          </View>
        )}
        {plan && (
          <>
            <Card style={styles.overviewCard}>
              <View style={styles.planHeader}><Ionicons name="sparkles" size={16} color={colors.gold} /><Text style={styles.planHeaderText}>AI 맞츤 계획</Text></View>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planDuration}>{plan.duration}</Text>
              <Text style={styles.planOverview}>{plan.overview}</Text>
            </Card>
            {plan.weeks.map((week, i) => (
              <Card key={i} style={styles.weekCard}>
                <TouchableOpacity style={styles.weekHeader} onPress={() => setExpandedWeek(expandedWeek === i ? null : i)}>
                  <View><Text style={styles.weekLabel}>{week.week}주차</Text><Text style={styles.weekTheme}>{week.theme}</Text></View>
                  <View style={styles.weekRight}><Text style={styles.weekHours}>{week.totalHours}</Text><Ionicons name={expandedWeek === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} /></View>
                </TouchableOpacity>
                {expandedWeek === i && (
                  <View style={styles.weekBody}>
                    {week.sessions.map((s, j) => (
                      <View key={j} style={styles.session}>
                        <View style={styles.sessionLeft}><Text style={styles.sessionDay}>{s.day}</Text><Text style={styles.sessionSport}>{s.sport}</Text></View>
                        <View style={styles.sessionRight}><Text style={styles.sessionDesc}>{s.description}</Text><Text style={styles.sessionDuration}>{s.duration}</Text></View>
                      </View>
                    ))}
                    {week.notes && <View style={styles.weekNote}><Text style={styles.weekNoteText}>💬 {week.notes}</Text></View>}
                  </View>
                )}
              </Card>
            ))}
            {plan.tips.length > 0 && (
              <Card style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 코치 팁</Text>
                {plan.tips.map((tip, i) => <View key={i} style={styles.tip}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>{tip}</Text></View>)}
              </Card>
            )}
            <Button label="새 계획 생성하기" onPress={handleGenerate} variant="secondary" style={styles.reBtn} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  intro: { alignItems: 'center', paddingVertical: 48 },
  introIcon: { fontSize: 56, marginBottom: 16 },
  introTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  introText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  startBtn: { width: '100%' },
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  loadingSubtext: { color: colors.textMuted, fontSize: 13 },
  overviewCard: { marginBottom: 12, borderWidth: 1, borderColor: colors.gold + '30', backgroundColor: '#120F00' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  planHeaderText: { color: colors.gold, fontSize: 12, fontWeight: '600' },
  planTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  planDuration: { color: colors.primary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  planOverview: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  weekCard: { marginBottom: 10 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 2 },
  weekTheme: { color: colors.text, fontSize: 15, fontWeight: '700' },
  weekRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekHours: { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  weekBody: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 14, gap: 10 },
  session: { flexDirection: 'row', gap: 12 },
  sessionLeft: { width: 68 },
  sessionDay: { color: colors.textMuted, fontSize: 11, marginBottom: 2 },
  sessionSport: { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  sessionRight: { flex: 1 },
  sessionDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  sessionDuration: { color: colors.textMuted, fontSize: 12 },
  weekNote: { backgroundColor: colors.divider, borderRadius: 8, padding: 10, marginTop: 4 },
  weekNoteText: { color: colors.textSecondary, fontSize: 13 },
  tipsCard: { marginBottom: 12 },
  tipsTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tip: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipBullet: { color: colors.primary, fontSize: 16, lineHeight: 20 },
  tipText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  reBtn: { marginTop: 4 },
});
