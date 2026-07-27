import { Link, Stack } from 'expo-router';
import { t } from '../src/i18n/ko';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../src/utils/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t.common.notFound}</Text>
        <Link href="/(app)" style={styles.link}>{t.common.goHome}</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 18, marginBottom: 16 },
  link: { color: colors.primary, fontSize: 16 },
});
