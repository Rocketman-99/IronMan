/**
 * Mounts every route screen once.
 *
 * The point is coverage of module resolution and first render, not behaviour:
 * a missing peer dependency (react-native-gifted-charts silently needing a
 * gradient backend, say) throws the moment the module is imported, and that is
 * exactly what shipped to a device undetected before this suite existed.
 */
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * 실제 앱은 루트(`app/_layout.tsx`)에서 SafeAreaProvider 로 감싼다.
 * 화면을 단독으로 렌더하는 이 테스트도 같은 환경을 만들어줘야
 * useSafeAreaInsets 를 쓰는 화면이 뜬다. 인셋 값은 시뮬레이션이므로
 * 실제 시스템 바 높이는 실기기에서만 확인된다.
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type ScreenCase = [name: string, load: () => { default: React.ComponentType<unknown> }];

const screens: ScreenCase[] = [
  ['app/_layout', () => require('../app/_layout')],
  ['app/index', () => require('../app/index')],
  ['app/+not-found', () => require('../app/+not-found')],

  ['(onboarding)/index', () => require('../app/(onboarding)/index')],
  ['(onboarding)/body-metrics', () => require('../app/(onboarding)/body-metrics')],
  ['(onboarding)/fitness-level', () => require('../app/(onboarding)/fitness-level')],
  ['(onboarding)/race-goals', () => require('../app/(onboarding)/race-goals')],

  ['(app)/index', () => require('../app/(app)/index')],
  ['(app)/log/index', () => require('../app/(app)/log/index')],
  ['(app)/log/running', () => require('../app/(app)/log/running')],
  ['(app)/log/swimming', () => require('../app/(app)/log/swimming')],
  ['(app)/log/cycling', () => require('../app/(app)/log/cycling')],
  ['(app)/history/index', () => require('../app/(app)/history/index')],
  ['(app)/progress/index', () => require('../app/(app)/progress/index')],
  ['(app)/goals/index', () => require('../app/(app)/goals/index')],
  ['(app)/goals/new', () => require('../app/(app)/goals/new')],
  ['workout/[id]', () => require('../app/workout/[id]')],
  ['ai/coach', () => require('../app/ai/coach')],
  ['ai/injury', () => require('../app/ai/injury')],
  ['ai/plan', () => require('../app/ai/plan')],
  ['profile/index', () => require('../app/profile/index')],
  ['settings/index', () => require('../app/settings/index')],
];

describe('route screens mount', () => {
  it.each(screens)('%s', (_name, load) => {
    const Screen = load().default;
    expect(Screen).toBeDefined();
    expect(() =>
      render(
        <SafeAreaProvider initialMetrics={METRICS}>
          <Screen />
        </SafeAreaProvider>
      )
    ).not.toThrow();
  });
});
