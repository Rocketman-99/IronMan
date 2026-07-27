module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-gifted-charts|gifted-charts-core|react-native-keyboard-controller|react-native-reanimated|react-native-worklets))',
  ],
  testMatch: ['<rootDir>/__tests__/**/*.test.tsx'],
};
