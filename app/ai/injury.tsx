import { useState } from 'react';
import { MarkdownText } from '../../src/components/common/MarkdownText';
import { t } from '../../src/i18n/ko';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/utils/theme';
import { useAIStore } from '../../src/stores/aiStore';
import { ConsiderationList, GeneratingIndicator, ContextSummary } from '../../src/components/ai/AIProgress';
import { INJURY_CONSIDERATIONS } from '../../src/services/ai/considerations';
import { useProfileStore } from '../../src/stores/profileStore';
import { useAppStore } from '../../src/stores/appStore';

export default function InjuryRisk() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { injuryAssessment, fetchInjuryRisk, isLoading, progressChars, startedAt, lastContext } = useAIStore();
  const { profile } = useProfileStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();

  async function handleAssess() {
    if (!checkAndIncrementAIUsage('deep')) return;
    await fetchInjuryRisk(db, profile);
  }

  const risk = injuryAssessment;
  const riskValue = risk?.overallRisk ?? 0;
  const riskColor = !risk ? colors.textMuted :
    riskValue < 30 ? colors.success :
    riskValue < 60 ? colors.warning : colors.error;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>{t.ai.injuryTitle}</Text>
      </TouchableOpacity>

      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeLabel}>{t.ai.riskLevel}</Text>
        <Text style={[styles.gaugeValue, { color: riskColor }]}>
          {risk ? `${riskValue}%` : '--'}
        </Text>
        <Text style={styles.gaugeSub}>
          {!risk ? t.ai.injuryStart :
            riskValue < 30 ? t.ai.riskLow :
            riskValue < 60 ? t.ai.riskMid : t.ai.riskHigh}
        </Text>
        {risk?.summary ? <MarkdownText style={styles.summary}>{risk.summary}</MarkdownText> : null}
      </View>

      {!hasApiKey && (
        <View style={styles.noKey}>
          <Text style={styles.noKeyText}>{t.ai.setApiKey}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.keyBtn}>
            <Text style={styles.keyBtnText}>{t.settings.title}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!risk && hasApiKey && (
        <>
          <TouchableOpacity style={styles.assessBtn} onPress={handleAssess} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.assessBtnText}>{t.dashboard.injuryRiskDesc}</Text>}
          </TouchableOpacity>
          {isLoading
            ? <GeneratingIndicator startedAt={startedAt} progressChars={progressChars} />
            : <ConsiderationList items={INJURY_CONSIDERATIONS} />}
        </>
      )}

      {risk && (
        <>
          {risk.concerns?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.ai.concerns}</Text>
              {risk.concerns.map((f, i) => (
                <Text key={i} style={styles.item}>⚠️ {f}</Text>
              ))}
            </View>
          )}
          {risk.recommendations?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.ai.recommendations}</Text>
              {risk.recommendations.map((r, i) => (
                <Text key={i} style={styles.item}>✅ {r}</Text>
              ))}
            </View>
          )}
          <ContextSummary context={lastContext} />
          {isLoading && <GeneratingIndicator startedAt={startedAt} progressChars={progressChars} />}
          <TouchableOpacity style={styles.retryBtn} onPress={handleAssess} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.retryBtnText}>{t.ai.injuryRetry}</Text>}
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
  gaugeCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.cardBorder },
  gaugeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  gaugeValue: { fontSize: 56, fontWeight: '900', marginBottom: 4 },
  gaugeSub: { color: colors.textSecondary, fontSize: 14 },
  summary: { color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  noKey: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16 },
  noKeyText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  keyBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  keyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  assessBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  assessBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  section: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  item: { color: colors.text, fontSize: 14, lineHeight: 22, marginBottom: 2 },
  retryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  retryBtnText: { color: colors.primary, fontWeight: '700' },
});
