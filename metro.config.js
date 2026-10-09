const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Pendo identifies components by name, so keep class and function names when
// minifying production bundles. The default minifier settings are kept.
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    ...config.transformer.minifierConfig?.mangle,
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;
