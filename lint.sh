#!/bin/bash

# ESLint helper script for AISearchScore

echo "Running ESLint on AISearchScore JavaScript files..."

# Check and fix client JS files (server files have many Node.js patterns)
npx eslint "client/c01_client-first-app/**/*.{js,mjs}" --fix

echo "Note: Server files skipped - they use Node.js patterns that ESLint flags as errors"

echo "ESLint check complete!"