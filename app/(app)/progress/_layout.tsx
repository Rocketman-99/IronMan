import { Stack } from 'expo-router';
import { colors } from '../../../src/utils/theme';
export default function ProgressLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
