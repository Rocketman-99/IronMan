import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/utils/theme';
import { useAIStore } from '../../../src/stores/aiStore';
import { useProfileStore } from '../../../src/stores/profileStore';
import { useAppStore } from '../../../src/stores/appStore';
import { type Message } from '../../../src/types';

const QUICK_PROMPTS = [
  '오늘 어떤 훈련을 할까요?',
  '회복 훈련 방법 알려주세요',
  '수영 실력 향상 팁',
  '사이클 설낙한 훈련 하는 법',
];

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && <Ionicons name="sparkles" size={12} color={colors.gold} style={styles.aiIcon} />}
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>{msg.content}</Text>
    </View>
  );
}

export default function AICoach() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { chatMessages, isStreaming, sendChat, clearChat } = useAIStore();
  const { profile } = useProfileStore();
  const { hasApiKey, checkAndIncrementAIUsage } = useAppStore();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => { if (chatMessages.length > 0) listRef.current?.scrollToEnd({ animated: true }); }, [chatMessages]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    if (!hasApiKey) { return; }
    if (!checkAndIncrementAIUsage('haiku')) return;
    setInput('');
    await sendChat(db, msg, profile);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>AI 코치</Text>
        <TouchableOpacity onPress={clearChat}><Ionicons name="trash-outline" size={20} color={colors.textMuted} /></TouchableOpacity>
      </View>

      {!hasApiKey && (
        <View style={styles.noApiKey}>
          <Text style={styles.noApiText}>AI 코치를 사용하려면 API 키를 설정하세요</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/settings')} style={styles.apiBtn}>
            <Text style={styles.apiBtnText}>설정으로 이동</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={chatMessages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <ChatBubble msg={item} />}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>AI 코치에게 무엇이든 물어보세요!</Text>
            <View style={styles.quickList}>
              {QUICK_PROMPTS.map(q => (
                <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => handleSend(q)}>
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {isStreaming && <ActivityIndicator color={colors.gold} style={styles.loading} />}

      <KeyboardStickyView style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="코치에게 질문하세요..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
          editable={!isStreaming && hasApiKey}
        />
        <TouchableOpacity onPress={() => handleSend()} disabled={!input.trim() || isStreaming || !hasApiKey} style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  noApiKey: { padding: 16, backgroundColor: colors.surface, margin: 12, borderRadius: 12, alignItems: 'center' },
  noApiText: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  apiBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  apiBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12, marginBottom: 8 },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: colors.card, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.cardBorder },
  aiIcon: { marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  aiText: { color: colors.text },
  emptyChat: { alignItems: 'center', paddingTop: 32 },
  emptyChatText: { color: colors.textSecondary, fontSize: 15, marginBottom: 20 },
  quickList: { gap: 8, width: '100%' },
  quickBtn: { backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  quickBtnText: { color: colors.textSecondary, fontSize: 13 },
  loading: { marginVertical: 8 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
