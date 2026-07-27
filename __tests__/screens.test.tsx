/**
 * Mounts every route screen once.
 *
 * The point is coverage of module resolution and first render, not behaviour:
 * a missing peer dependency (react-native-gifted-charts silently needing a
 * gradient backend, say) throws the moment the module is imported, and that is
 * exactly what shipped to a device undetected before this suite existed.
 */
import { render } from '@testing-library/react-native';

type ScreenCase = [name: string, load: () => { default: React.ComponentType<unknown> }];

const screens: ScreenCase[] = [
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
    expect(() => render(<Screen />)).not.toThrow();
  });
});
