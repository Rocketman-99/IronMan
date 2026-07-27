import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../../src/stores/appStore';
import { getAPIKey } from '../../../src/services/ai/client';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { colors } from '../../../src/utils/theme';

export default function SettingsScreen() {
  const { hasApiKey, setApiKey, clearApiKey, aiCallsToday } = useAppStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (hasApiKey) {
      getAPIKey().then((k) => {
        if (k) setMaskedKey(`sk-ant-...${k.slice(-6)}`);
      });
    }
  }, [hasApiKey]);

  async function handleSave() {
    const key = apiKeyInput.trim();
    if (!key) return Alert.alert('API 키를 입력해주세요');
    if (!key.startsWith('sk-ant-')) {
      return Alert.alert('잘못된 형식', 'Anthropic API 키는 sk-ant- 로 시작해야 합니다.');
    }
    setSaving(true);
    try {
      await setApiKey(key);
      setMaskedKey(`sk-ant-...${key.slice(-6)}`);
      setApiKeyInput('');
      Alert.alert('저장 완료', 'API 키가 안전하게 저장되었습니다.');
    } catch {
      Alert.alert('오류', 'API 키 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    Alert.alert('API 키 삭제', 'API 키를 삭제하면 AI 기능을 사용할 수 없습니다. 계속할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          setRemoving(true);
          try {
            await clearApiKey();
            setMaskedKey('');
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  }

  const dailyBudgetPercent = Math.min(100, Math.round((aiCallsToday / 15) * 100));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>

        <Text style={styles.sectionTitle}>AI 코치 설정</Text>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={18} color={colors.gold} />
            <Text style={styles.cardTitle}>Anthropic API 키</Text>
          </View>

          {hasApiKey ? (
            <View>
              <View style={styles.keyRow}>
                <View style={styles.keyStatus}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.keyStatusText}>연결됨</Text>
                </View>
                <Text style={styles.maskedKey}>{maskedKey}</Text>
              </View>
              <View style={styles.usageWrap}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>오늘 AI 사용량</Text>
                  <Text style={styles.usageValue}>{aiCallsToday.toFixed(1)} / 15 포인트</Text>
                </View>
                <View style={styles.usageBg}>
                  <View style={[styles.usageFill, {
                    width: `${dailyBudgetPercent}%`,
                    backgroundColor: dailyBudgetPercent >= 80 ? colors.warning : colors.success,
                  }]} />
                </View>
              </View>
              <Button
                label="API 키 삭제"
                onPress={handleRemove}
                variant="danger"
                loading={removing}
                style={styles.removeBtn}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.apiGuide}>
                Anthropic Console에서 발급받은 API 키를 입력하세요.{'\n'}
                키는 기기에 안전하게 암호화 저장됩니다.
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.keyInput}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="sk-ant-api03-..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
                  <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Button label="저장" onPress={handleSave} loading={saving} style={styles.saveBtn} />
            </View>
          )}
        </Card>

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>AI 모델 정보</Text>
        <Card style={styles.card}>
          <ModelRow icon="flash-outline" label="빠른 분석 / 팁 / 채팅" model="Claude Haiku" cost="0.5 포인트" />
          <View style={styles.divider} />
          <ModelRow icon="analytics-outline" label="부상 평가 / 훈련 계획" model="Claude Sonnet" cost="2 포인트" />
          <View style={styles.divider} />
          <View style={styles.budgetNote}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.budgetNoteText}>일일 총 한도: 15 포인트 (매일 자정 초기화)</Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>앱 정보</Text>
        <Card style={styles.card}>
          <InfoRow label="앱 이름" value="IronMan" />
          <View style={styles.divider} />
          <InfoRow label="버전" value="1.0.0" />
          <View style={styles.divider} />
          <InfoRow label="플랫폼" value="iOS / Android" />
        </Card>

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function ModelRow({ icon, label, model, cost }: { icon: string; label: string; model: string; cost: string }) {
  return (
    <View style={styles.modelRow}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} />
      <View style={styles.modelInfo}>
        <Text style={styles.modelLabel}>{label}</Text>
        <Text style={styles.modelName}>{model}</Text>
      </View>
      <Text style={styles.modelCost}>{cost}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionSpaced: { marginTop: 24 },
  card: { marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  keyStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyStatusText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  maskedKey: { color: colors.textMuted, fontSize: 12, fontFamily: 'monospace' },
  usageWrap: { marginBottom: 12 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  usageLabel: { color: colors.textSecondary, fontSize: 12 },
  usageValue: { color: colors.textSecondary, fontSize: 12 },
  usageBg: { height: 6, backgroundColor: colors.divider, borderRadius: 3 },
  usageFill: { height: 6, borderRadius: 3 },
  removeBtn: { borderRadius: 10 },
  apiGuide: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  keyInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12,
    fontSize: 13, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder,
    fontFamily: 'monospace',
  },
  eyeBtn: { position: 'absolute', right: 12 },
  saveBtn: { borderRadius: 10 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modelInfo: { flex: 1 },
  modelLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  modelName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  modelCost: { color: colors.primaryLight, fontSize: 12, fontWeight: '600' },
  budgetNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetNoteText: { color: colors.textMuted, fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: colors.textSecondary, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
