#!/bin/bash

# Setup Git hooks for security enforcement

echo "🔧 Setting up Git security hooks..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔒 Running pre-commit security checks..."

# Run security validation
./security-check.sh

if [ $? -ne 0 ]; then
    echo "❌ Commit blocked due to security violations"
    echo "📖 Fix issues according to CODING_STANDARDS.md"
    exit 1
fi

# Run linting
./lint.sh

echo "✅ Pre-commit checks passed"
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully"
echo "📖 All commits will now be validated for security compliance"