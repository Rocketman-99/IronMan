const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// @anthropic-ai/sdk statically references Node builtins (node:fs, node:path) from
// its file-based credential loader, which React Native has no equivalent for. That
// code path is never reached here — the API key comes from expo-secure-store — so
// resolve those specifiers to an empty module instead of failing the bundle.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
