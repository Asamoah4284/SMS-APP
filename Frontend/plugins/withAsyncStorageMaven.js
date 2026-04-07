const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER = 'async-storage-local-maven';

/**
 * Async Storage v3 resolves org.asyncstorage.shared_storage:storage-android from a
 * local Maven repo under node_modules. Without this repo, release builds fail
 * (e.g. EAS: "Could not find ... storage-android:1.0.0").
 */
module.exports = function withAsyncStorageMavenRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }
    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) {
      return config;
    }

    const insert = `\n    maven { url "$rootDir/../node_modules/@react-native-async-storage/async-storage/android/local_repo" } // ${MARKER}`;

    const jitpack = "    maven { url 'https://www.jitpack.io' }";
    if (contents.includes(jitpack)) {
      config.modResults.contents = contents.replace(jitpack, jitpack + insert);
      return config;
    }

    const allIdx = contents.indexOf('allprojects');
    if (allIdx === -1) {
      return config;
    }
    const mcIdx = contents.indexOf('mavenCentral()', allIdx);
    if (mcIdx === -1) {
      return config;
    }
    const pos = mcIdx + 'mavenCentral()'.length;
    config.modResults.contents =
      contents.slice(0, pos) + insert + contents.slice(pos);
    return config;
  });
};
