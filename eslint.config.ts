import js from "@eslint/js";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  includeIgnoreFile(`${import.meta.dirname}/.gitignore`),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
