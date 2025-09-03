export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "data/",
      "*.log",
      ".env",
      "*.bak",
      "*_v[0-9]*",
      "*_t[0-9]*",
      "sources/",
      "system-documentation/"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off"
    }
  }
];