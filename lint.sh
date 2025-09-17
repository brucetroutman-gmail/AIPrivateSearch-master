#!/bin/bash

# ESLint helper script for AISearchScore

echo "🔍 Running ESLint on AISearchScore JavaScript files..."

# Run ESLint on all JS files
npx eslint "client/**/*.{js,mjs}" "server/**/*.{js,mjs}" --fix

# Capture exit code
ESLINT_EXIT_CODE=$?

if [ $ESLINT_EXIT_CODE -eq 0 ]; then
    echo "✅ ESLint check passed!"
else
    echo "❌ ESLint found issues that need to be fixed"
    exit $ESLINT_EXIT_CODE
fi