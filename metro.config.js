// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

// cho Metro resolve .cjs của firebase
defaultConfig.resolver.sourceExts.push('cjs');
// tắt strict package.json exports resolution để tránh không vào được entry nội bộ của firebase
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
