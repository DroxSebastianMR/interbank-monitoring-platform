// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  { ignores: ["dist/**"] },
  expoConfig,
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          conditionNames: [
            "types",
            "react-native",
            "source",
            "import",
            "require",
            "browser",
            "default",
          ],
          project: "./tsconfig.json",
        },
      },
    },
  },
]);
