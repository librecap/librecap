import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
      ecmaVersion: 12,
      sourceType: "module"
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "warn",
      "no-unused-vars": "warn"
    },
    files: ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx", "test/**/*.js"],
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 12,
      sourceType: "commonjs"
    },
    rules: {
      // Disable some rules for Node.js environment
      "no-undef": "error"
    },
    files: ["build.js", "serve-demo.js"],
  },
  // Ignore dist files completely
  {
    ignores: ["dist/**"]
  }
]; 