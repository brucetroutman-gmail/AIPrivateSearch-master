#!/bin/bash

# Setup Git hooks for security enforcement

echo "🔧 Setting up Git security hooks..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔒 Running pre-commit checks..."

# Run ESLint first
echo "🔍 Running ESLint..."
./lint.sh

if [ $? -ne 0 ]; then
    echo "❌ Commit blocked due to ESLint errors"
    echo "🔧 Fix ESLint issues before committing"
    exit 1
fi

# Run security validation
echo "🔒 Running security checks..."
./security-check.sh

if [ $? -ne 0 ]; then
    echo "❌ Commit blocked due to security violations"
    echo "📖 Fix issues according to CODING_STANDARDS.md"
    exit 1
fi

echo "✅ All pre-commit checks passed"
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully"
echo "📖 All commits will now be validated for ESLint and security compliance"