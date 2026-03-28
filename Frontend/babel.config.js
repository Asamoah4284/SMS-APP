// Resolve preset by absolute path so Metro/Babel always find it (Windows-safe).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require.resolve('babel-preset-expo')],
  };
};
