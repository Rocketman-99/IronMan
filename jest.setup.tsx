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
      canGoBack: jest.fn(() => true),
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

/**
 * expo-updates. jest-expo 프리셋에는 목이 없어 직접 넣는다.
 *
 * `mockUpdatesState`를 테스트에서 갈아끼워 다운로드 중·적용 대기 같은 상태를
 * 만들어 낸다. 기본값은 "아무 일도 없음"이라 다른 화면 테스트에는 영향이 없다.
 */
const mockUpdatesState: {
  isEnabled: boolean;
  useUpdates: Record<string, unknown>;
} = {
  isEnabled: true,
  useUpdates: {},
};

const mockUpdatesIdle = {
  currentlyRunning: { isEmbeddedLaunch: true, isEmergencyLaunch: false, emergencyLaunchReason: null },
  isChecking: false,
  isDownloading: false,
  isUpdateAvailable: false,
  isUpdatePending: false,
  isRestarting: false,
  isStartupProcedureRunning: false,
  restartCount: 0,
};

const mockUpdates = {
  get isEnabled() {
    return mockUpdatesState.isEnabled;
  },
  runtimeVersion: '1.0.0',
  channel: 'preview',
  updateId: null,
  isEmbeddedLaunch: true,
  useUpdates: () => ({ ...mockUpdatesIdle, ...mockUpdatesState.useUpdates }),
  reloadAsync: jest.fn(async () => undefined),
  checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false, isRollBackToEmbedded: false })),
  fetchUpdateAsync: jest.fn(async () => ({ isNew: false, isRollBackToEmbedded: false })),
  /** 테스트 전용 — 다음 렌더에서 useUpdates() 가 돌려줄 값을 정한다. */
  __setState(next: Partial<typeof mockUpdatesState>) {
    Object.assign(mockUpdatesState, next);
  },
};

jest.mock('expo-updates', () => mockUpdates);

beforeEach(() => {
  mockSecureStore.clear();
  mockUpdatesState.isEnabled = true;
  mockUpdatesState.useUpdates = {};
  mockUpdates.reloadAsync.mockClear();
  mockUpdates.checkForUpdateAsync.mockClear();
  mockUpdates.fetchUpdateAsync.mockClear();
});
