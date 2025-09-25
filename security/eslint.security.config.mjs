import js from "@eslint/js";
import globals from "globals";
import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/**", "*.db", "*.log", ".env*", "system-documentation/**", "sources/**", "*.md", "package-lock.json"]
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      ecmaVersion: 2022,
      sourceType: "module"
    },
    plugins: {
      security,
      "no-unsanitized": noUnsanitized
    },
    rules: {
      // CRITICAL Security rules - Code Injection Prevention
      "no-eval": "error",
      "no-implied-eval": "error", 
      "no-new-func": "error",
      "no-script-url": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-new-buffer": "error",
      
      // XSS Prevention
      "no-unsanitized/method": "error",
      "no-unsanitized/property": "error",
      
      // Basic rules
      "no-unused-vars": "off",
      "no-console": "off"
    }
  }
];