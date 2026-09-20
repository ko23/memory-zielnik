import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default defineConfig(
  {
    ignores: ["dist/", ".astro/"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs["recommended-latest"].rules,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...jsxA11y.configs.recommended,
  },
  astro.configs["flat/recommended"],
  astro.configs["flat/jsx-a11y-recommended"],
);
