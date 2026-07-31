import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { colors } from '../../utils/theme';
import { t } from '../../i18n/ko';

/**
 * 무선 업데이트가 어디까지 왔는지 보여주는 배너.
 *
 * expo-updates 는 기본값이 "예전 번들로 즉시 실행하고 새 번들은 뒤에서 받기"라,
 * 앱을 두 번 켜야 새 버전이 뜬다. 그동안 화면에는 아무 표시가 없어서 받는 중인지,
 * 서버에 올라오긴 했는지 알 수 없었다. 여기서 그걸 보이게 하고, 다 받았으면
 * 탭 한 번으로 바로 적용한다.
 *
 * **자동으로 재시작하지 않는다.** 다운로드가 끝나자마자 reloadAsync 를 부르면
 * 운동을 기록하던 중에 입력하던 내용이 통째로 날아간다. 누를 때만 적용한다.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isDownloading, downloadProgress, isUpdatePending, downloadError } = Updates.useUpdates();
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 개발 빌드·Expo Go 에서는 모듈이 꺼져 있어 상태가 영영 오지 않는다.
  if (!Updates.isEnabled) return null;

  async function apply() {
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // 재시작에 실패하면 다음 실행 때 어차피 적용된다. 배너만 닫는다.
      setApplying(false);
      setDismissed(true);
    }
  }

  if (isUpdatePending && !dismissed) {
    return (
      <Banner top={insets.top} icon="arrow-down-circle" tint={colors.success}>
        <Text style={styles.text}>{t.update.ready}</Text>
        <TouchableOpacity onPress={apply} disabled={applying} style={styles.action}>
          {applying ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.actionText}>{t.update.applyNow}</Text>
          )}
        </TouchableOpacity>
      </Banner>
    );
  }

  if (isDownloading) {
    // downloadProgress 는 서버가 Content-Length 를 줄 때만 채워진다.
    // 없으면 퍼센트를 지어내지 않고 문구만 보여준다.
    const percent =
      typeof downloadProgress === 'number'
        ? Math.round(Math.min(1, Math.max(0, downloadProgress)) * 100)
        : null;
    return (
      <Banner top={insets.top} icon="cloud-download-outline" tint={colors.primary}>
        <View style={styles.grow}>
          <Text style={styles.text}>
            {percent === null
              ? t.update.downloading
              : t.update.downloadingPercent.replace('{n}', String(percent))}
          </Text>
          {percent !== null && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
          )}
        </View>
      </Banner>
    );
  }

  if (downloadError && !dismissed) {
    return (
      <Banner top={insets.top} icon="alert-circle-outline" tint={colors.warning}>
        <Text style={styles.text}>{t.update.failed}</Text>
        <TouchableOpacity onPress={() => setDismissed(true)} style={styles.action}>
          <Text style={styles.actionText}>{t.update.dismiss}</Text>
        </TouchableOpacity>
      </Banner>
    );
  }

  return null;
}

function Banner({
  top,
  icon,
  tint,
  children,
}: {
  top: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.banner, { top: top + 8, borderLeftColor: tint }]}>
      <Ionicons name={icon} size={18} color={tint} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    // 화면 내용 위에 떠야 한다.
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  grow: { flex: 1 },
  text: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
  action: { paddingHorizontal: 8, paddingVertical: 4 },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.divider, marginTop: 6 },
  fill: { height: 3, borderRadius: 2, backgroundColor: colors.primary },
});
