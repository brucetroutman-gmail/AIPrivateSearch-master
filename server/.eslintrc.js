module.exports = {
    env: {
        node: true,
        es2022: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'no-control-regex': 'off'
    }
};