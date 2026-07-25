import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useAIStore } from '../../../src/stores/aiStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';
import { sendChatMessage } from '../../../src/services/ai/chat';
import { getRecentWorkouts } from '../../../src/db/queries/workouts';
import { colors } from '../../../src/utils/theme';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';

const QUICK_PROMPTS = ['이번 주 훈련 평가해줘', '다음 훈련 추천해줘', '부상 위험 체크해줘', '회복 방법 알려줘'];

export default function AICoachScreen() {
  const db = useSQLiteContext();
  const { profile } = useProfileStore();
  const { checkAndIncrementAIUsage } = useAppStore();
  const { chatMessages, isStreaming, addUserMessage, startStream, appendStreamChunk, finalizeStream } = useAIStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [chatMessages, isStreaming]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || isStreaming) return;
    setInput('');
    const canUse = checkAndIncrementAIUsage(0.5);
    if (!canUse) { addUserMessage(message); startStream(); appendStreamChunk('오늘의 AI 사용 한도에 도달했습니다. 내일 다시 시도해주세요.'); finalizeStream(); return; }
    if (!profile) { addUserMessage(message); startStream(); appendStreamChunk('프로필을 먼저 설정해주세요.'); finalizeStream(); return; }
    addUserMessage(message);
    startStream();
    try {
      const recentWorkouts = await getRecentWorkouts(db, 7);
      await sendChatMessage(chatMessages.concat({ role: 'user', content: message }), profile, recentWorkouts, (chunk) => appendStreamChunk(chunk));
      finalizeStream();
    } catch {
      appendStreamChunk('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      finalizeStream();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="AI 코치" showBack />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          {chatMessages.length === 0 && (
            <View style={styles.welcome}>
              <Text style={styles.welcomeIcon}>🤖</Text>
              <Text style={styles.welcomeTitle}>AI 코치</Text>
              <Text style={styles.welcomeText}>훈련 조언, 회복 방법, 부상 예방 등 무엇이든 물어보세요</Text>
              <View style={styles.quickGrid}>{QUICK_PROMPTS.map(q => <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => handleSend(q)}><Text style={styles.quickText}>{q}</Text></TouchableOpacity>)}</View>
            </View>
          )}
          {chatMessages.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} />)}
          {isStreaming && chatMessages[chatMessages.length - 1]?.role === 'user' && (
            <View style={[styles.bubble, styles.assistantBubble]}><ActivityIndicator size="small" color={colors.primaryLight} /></View>
          )}
        </ScrollView>
        {chatMessages.length > 0 && (
          <View style={styles.quickRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRowContent}>
              {QUICK_PROMPTS.map(q => <TouchableOpacity key={q} style={styles.quickChip} onPress={() => handleSend(q)} disabled={isStreaming}><Text style={styles.quickChipText}>{q}</Text></TouchableOpacity>)}
            </ScrollView>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="메시지를 입력하세요..." placeholderTextColor={colors.textMuted} multiline maxLength={500} returnKeyType="send" onSubmitEditing={() => handleSend()} />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]} onPress={() => handleSend()} disabled={!input.trim() || isStreaming}>
            <Ionicons name="send" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubbleWrap, isUser && styles.userWrap]}>
      {!isUser && <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  welcome: { alignItems: 'center', paddingVertical: 32 },
  welcomeIcon: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  welcomeText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  quickGrid: { width: '100%', gap: 8 },
  quickBtn: { backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.cardBorder },
  quickText: { color: colors.text, fontSize: 14, textAlign: 'center' },
  bubbleWrap: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userWrap: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.cardBorder },
  bubbleText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: colors.text },
  quickRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: 8 },
  quickRowContent: { paddingHorizontal: 12, gap: 8 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  quickChipText: { color: colors.textSecondary, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.divider, gap: 8 },
  input: { flex: 1, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.cardBorder },
});
