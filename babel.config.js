module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      "react-native-worklets/plugin",
      [
        "module-resolver",
        {
          root: ["."],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          alias: {
            "@/core":     "./src/core",
            "@/features": "./src/features",
            "@/design":   "./src/design",
            "@/shared":   "./src/shared",
          },
        },
      ],
    ],
  };
};
