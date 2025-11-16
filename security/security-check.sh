#!/bin/bash

# Security validation script for AIPrivateSearch

echo "🔒 Running Security Validation..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to root directory (parent of security folder)
cd "$SCRIPT_DIR/.."

# 1. Check for banned patterns
echo "📋 Checking for banned security patterns..."

BANNED_PATTERNS=(
    "innerHTML.*="
    "document\.write"
    "eval[(]"
    "new Function"
    "\.html[(]"
)

VIOLATIONS=0

for pattern in "${BANNED_PATTERNS[@]}"; do
    echo "  Checking for: $pattern"
    matches=$(grep -r -n "$pattern" client/c01_client-first-app/ --include="*.js" --include="*.mjs" || true)
    
    # Filter out safe innerHTML usage for innerHTML
    if [[ "$pattern" == "innerHTML.*=" ]]; then
        # Get matches with context to check for eslint-disable comments
        context_matches=$(grep -r -n -B1 "$pattern" client/c01_client-first-app/ --include="*.js" --include="*.mjs" || true)
        # Filter out eslint-disabled lines and safe patterns
        safe_matches=$(echo "$context_matches" | grep -B1 "eslint-disable" | grep "innerHTML.*=" || true)
        matches=$(echo "$matches" | grep -v -F "$(echo "$safe_matches" | cut -d: -f1-2)" | grep -v "innerHTML = ''" | grep -v "innerHTML = '<option" | grep -v "headerHTML" | grep -v "footerHTML" || true)
    fi
    
    if [ ! -z "$matches" ]; then
        echo "    ❌ VIOLATION FOUND:"
        echo "$matches"
        VIOLATIONS=$((VIOLATIONS + 1))
    else
        echo "    ✅ Clean"
    fi
done

# 2. Run ESLint security rules
echo ""
echo "📋 Running ESLint security scan..."
npx eslint "client/c01_client-first-app/**/*.{js,mjs}" --config ./security/eslint.security.config.mjs --rule 'no-eval: error' --rule 'no-implied-eval: error' --rule 'no-new-func: error'

# 3. Check for hardcoded secrets
echo ""
echo "📋 Checking for hardcoded secrets..."
SECRET_PATTERNS=(
    "password.*=.*['\"]"
    "api_key.*=.*['\"]"
    "secret.*=.*['\"]"
    "['\"].*secret.*['\"]" # Only match actual secrets, not UI tokens
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    matches=$(grep -r -i "$pattern" . --include="*.js" --include="*.mjs" --exclude="load-aiss.command" --exclude-dir="node_modules" || true)
    if [ ! -z "$matches" ]; then
        echo "    ⚠️  POTENTIAL SECRET FOUND:"
        echo "$matches"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done

# 4. Summary
echo ""
if [ $VIOLATIONS -eq 0 ]; then
    echo "✅ Security validation passed!"
    exit 0
else
    echo "❌ Security validation failed with $VIOLATIONS violations"
    echo "📖 See CODING_STANDARDS.md for remediation guidance"
    exit 1
fi