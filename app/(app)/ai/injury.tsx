import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';
import { assessInjuryRisk } from '../../../src/services/ai/injuryRisk';
import { getRecentWorkouts } from '../../../src/db/queries/workouts';
import { type InjuryRiskAssessment } from '../../../src/types';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { Card } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import { colors } from '../../../src/utils/theme';

export default function InjuryScreen() {
  const db = useSQLiteContext();
  const { profile } = useProfileStore();
  const { checkAndIncrementAIUsage } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InjuryRiskAssessment | null>(null);

  async function handleAssess() {
    if (!checkAndIncrementAIUsage(2)) { Alert.alert('한도 초과', '오늘의 AI 사용 한도에 도달했습니다.'); return; }
    if (!profile) { Alert.alert('프로필 필요', '먼저 프로필을 설정해주세요.'); return; }
    setLoading(true);
    try {
      const workouts = await getRecentWorkouts(db, 30);
      setResult(await assessInjuryRisk(profile, workouts));
    } catch { Alert.alert('오류', 'AI 평가 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }

  const riskColor = result ? result.overallRisk >= 70 ? colors.error : result.overallRisk >= 40 ? colors.warning : colors.success : colors.textMuted;
  const riskLabel = result ? result.overallRisk >= 70 ? '위험' : result.overallRisk >= 40 ? '주의' : '안전' : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="부상 위험 평가" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {!result && !loading && (
          <View style={styles.intro}>
            <Text style={styles.introIcon}>🛡️</Text>
            <Text style={styles.introTitle}>부상 위험 평가</Text>
            <Text style={styles.introText}>최근 30일간의 훈련 데이터를 AI가 분석하여{'
'}부상 위험도와 취약 부위를 평가합니다.</Text>
            <Button label="평가 시작하기" onPress={handleAssess} style={styles.startBtn} />
          </View>
        )}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>AI가 훈련 데이터를 분석 중...</Text>
          </View>
        )}
        {result && (
          <>
            <Card style={styles.riskCard}>
              <Text style={styles.riskTitle}>종합 위험도</Text>
              <View style={styles.gaugeWrap}>
                <View style={styles.gaugeBg}><View style={[styles.gaugeFill, { width: `${result.overallRisk}%`, backgroundColor: riskColor }]} /></View>
                <View style={styles.gaugeLabels}>
                  <Text style={styles.gaugeMin}>0</Text>
                  <Text style={[styles.gaugeScore, { color: riskColor }]}>{result.overallRisk}<Text style={styles.gaugeUnit}>/100</Text></Text>
                  <Text style={styles.gaugeMax}>100</Text>
                </View>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: riskColor + '20', borderColor: riskColor }]}>
                <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLabel}</Text>
              </View>
            </Card>
            {result.concerns.length > 0 && (
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>⚠️ 우려 사항</Text>
                {result.concerns.map((c, i) => <View key={i} style={styles.concernItem}><View style={styles.concernBullet} /><Text style={styles.concernText}>{c}</Text></View>)}
              </Card>
            )}
            {result.recommendations.length > 0 && (
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>💡 권장 사항</Text>
                {result.recommendations.map((r, i) => <View key={i} style={styles.recItem}><Text style={styles.recNumber}>{i + 1}</Text><Text style={styles.recText}>{r}</Text></View>)}
              </Card>
            )}
            <Card style={styles.card}>
              <View style={styles.summaryHeader}><Ionicons name="sparkles" size={16} color={colors.gold} /><Text style={styles.summaryTitle}>AI 종합 의견</Text></View>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </Card>
            <Button label="다시 평가하기" onPress={handleAssess} variant="secondary" style={styles.reBtn} />
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
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  riskCard: { marginBottom: 12, alignItems: 'center' },
  riskTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 20 },
  gaugeWrap: { width: '100%', marginBottom: 16 },
  gaugeBg: { height: 16, backgroundColor: colors.divider, borderRadius: 8, overflow: 'hidden' },
  gaugeFill: { height: 16, borderRadius: 8 },
  gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  gaugeMin: { color: colors.textMuted, fontSize: 11 },
  gaugeMax: { color: colors.textMuted, fontSize: 11 },
  gaugeScore: { fontSize: 32, fontWeight: '800' },
  gaugeUnit: { fontSize: 14, fontWeight: '400' },
  riskBadge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  riskBadgeText: { fontSize: 14, fontWeight: '700' },
  card: { marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  concernItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  concernBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning, marginTop: 6 },
  concernText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  recItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  recNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 22 },
  recText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  summaryTitle: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  summaryText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  reBtn: { marginTop: 8 },
});
