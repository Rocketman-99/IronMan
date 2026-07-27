/**
 * Test environment shims for modules that need a native runtime.
 *
 * These smoke tests exist to catch import- and mount-time failures — the class of
 * bug that Metro bundles happily and only explodes on a real device (a library
 * resolving an optional native peer inside a try/catch, for example). They do not
 * exercise touch handling, layout, or any native view behaviour.
 *
 * Names below are `mock`-prefixed because jest.mock factories are hoisted above
 * the surrounding scope and may only close over variables with that prefix.
 */
import React from 'react';

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest')
);

// In-memory stand-in for the SQLite database screens read through
// useSQLiteContext(). Every query resolves empty so screens render their
// empty states rather than crashing.
const mockDb = {
  getAllAsync: jest.fn(async () => []),
  getFirstAsync: jest.fn(async () => null),
  runAsync: jest.fn(async () => ({ lastInsertRowId: 1, changes: 1 })),
  execAsync: jest.fn(async () => undefined),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => {
    await cb();
  }),
};

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
  SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
  openDatabaseAsync: jest.fn(async () => mockDb),
}));

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockSecureStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    mockSecureStore.set(k, v);
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    mockSecureStore.delete(k);
  }),
}));

// Never let a test reach the real API.
jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(async () => ({ content: [{ type: 'text', text: '{}' }] })),
      stream: jest.fn(),
    },
  }))
);

jest.mock('expo-router', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
    }),
    useLocalSearchParams: () => ({ id: '1' }),
    useFocusEffect: jest.fn(),
    Stack: Object.assign(passthrough, { Screen: () => null }),
    Tabs: Object.assign(passthrough, { Screen: () => null }),
    Link: passthrough,
    Redirect: () => null,
    SplashScreen: { preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() },
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

beforeEach(() => {
  mockSecureStore.clear();
});
