const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Use compiled JS for react-native-svg. The package's "react-native" field points at
 * src/ TypeScript, which re-exports types Metro cannot resolve ("./lib/extract/types").
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native-svg/lib/commonjs/index.js',
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
