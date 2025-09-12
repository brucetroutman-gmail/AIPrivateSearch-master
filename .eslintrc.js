module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['server/**/*.{js,mjs}'],
            env: {
                node: true,
                browser: false,
                es2022: true
            },
            globals: {
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly'
            },
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            }
        }
    ],
    globals: {
        // Client-side globals
        loadScoreModels: 'readonly',
        exportToDatabase: 'readonly',
        showNotification: 'readonly',
        sanitizeInput: 'readonly',
        logError: 'readonly',
        toggleDarkMode: 'readonly',
        toggleMenu: 'readonly',
        toggleDeveloperMode: 'readonly',
        logger: 'readonly'
    },
    rules: {
        // Basic rules
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'no-undef': 'error',
        'no-control-regex': 'off',
        'no-unused-private-class-members': 'warn',
        
        // Security rules - CRITICAL
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        
        // Code quality rules
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': 'error'
    }
};