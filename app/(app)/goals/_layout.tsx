import { Stack } from 'expo-router';
import { colors } from '../../../src/utils/theme';
export default function GoalsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
