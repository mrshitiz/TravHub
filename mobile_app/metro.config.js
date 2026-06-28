const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions so Expo Web can load SQLite
config.resolver.assetExts.push('wasm');

module.exports = config;
