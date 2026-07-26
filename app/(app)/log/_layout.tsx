import { Stack } from 'expo-router';
import { colors } from '../../../src/utils/theme';

export default function LogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}
