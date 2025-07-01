const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for handling buffer polyfill
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {
  buffer: require.resolve('buffer'),
};

module.exports = config;
