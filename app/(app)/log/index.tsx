import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, sportColors } from '../../../src/utils/theme';

const SPORTS = [
  { type: 'running', label: '러닝', icon: 'fitness-outline' as const, emoji: '🏃', desc: '로드 / 트레일 / 트레드밀' },
  { type: 'swimming', label: '수영', icon: 'water-outline' as const, emoji: '🏊', desc: '풀 / 오픈 워터' },
  { type: 'cycling', label: '사이클', icon: 'bicycle-outline' as const, emoji: '🚴', desc: '로드 / 실내 트레이너' },
];

export default function LogIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>운동 종목 선택</Text>
      <Text style={styles.subtitle}>오늘 어떤 훈련을 했나요?</Text>
      <View style={styles.list}>
        {SPORTS.map(sport => (
          <TouchableOpacity
            key={sport.type}
            style={[styles.card, { borderLeftColor: sportColors[sport.type as keyof typeof sportColors] }]}
            onPress={() => router.push(`/(app)/log/${sport.type}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{sport.emoji}</Text>
            <View style={styles.cardBody}>
              <Text style={[styles.sportName, { color: sportColors[sport.type as keyof typeof sportColors] }]}>{sport.label}</Text>
              <Text style={styles.sportDesc}>{sport.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },
  list: { gap: 14 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderWidth: 1, borderColor: colors.cardBorder },
  emoji: { fontSize: 32, marginRight: 16 },
  cardBody: { flex: 1 },
  sportName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sportDesc: { fontSize: 13, color: colors.textSecondary },
});
