import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';
import { t } from '../../i18n/ko';
import { type TrainingContext } from '../../services/ai/context';

/**
 * 깊은 분석이 무엇을 보고 판단하는지, 지금 어디까지 왔는지 보여준다.
 *
 * 30~60초씩 걸리는 동안 화면이 비어 있으면 멈춘 것처럼 보인다. 여기서 쓰는
 * 진행 정보는 스트리밍으로 실제 받은 글자 수라 가짜 진행바가 아니다.
 * 다만 **남은 시간은 알 수 없어** 평균 소요시간을 안내로만 적는다.
 */

/** 생성 전 — 어떤 정보를 볼 것인지 */
export function ConsiderationList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="information-circle-outline" size={16} color={colors.gold} />
        <Text style={styles.cardTitle}>{t.aiContext.title}</Text>
      </View>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** 생성 중 — 경과 시간과 받은 분량 */
export function GeneratingIndicator({
  startedAt,
  progressChars,
}: {
  startedAt: number | null;
  progressChars: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  // 글자가 오기 전에는 아직 생각 중이라는 뜻이다.
  const stage = progressChars > 0 ? t.aiContext.stageWriting : t.aiContext.stageThinking;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.cardTitle}>{stage}</Text>
      </View>
      <Text style={styles.progressText}>
        {t.aiContext.elapsed.replace('{sec}', String(elapsed))}
        {progressChars > 0
          ? ` · ${t.aiContext.received.replace('{n}', String(progressChars))}`
          : ''}
      </Text>
      <Text style={styles.estimate}>{t.aiContext.estimate}</Text>
    </View>
  );
}

/** 생성 후 — 실제로 투입된 근거 */
export function ContextSummary({ context }: { context: TrainingContext | null }) {
  if (!context) return null;
  return <ConsiderationList items={context.considered} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 12,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  progressText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  estimate: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
