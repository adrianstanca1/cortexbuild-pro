#!/bin/bash
# Pre-commit hook for code quality checks
# Install with: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "🔍 Running pre-commit checks..."

# Check for TypeScript errors
echo "📝 Checking TypeScript..."
npx tsc --noEmit || {
    echo "❌ TypeScript check failed. Please fix errors before committing."
    exit 1
}

# Run ESLint
echo "🔧 Running ESLint..."
npm run lint || {
    echo "❌ Linting failed. Please fix lint errors before committing."
    exit 1
}

# Check for console.log in non-test files
echo "🔍 Checking for console.log..."
CONSOLE_LOGS=$(git diff --cached --name-only | grep -E '\.(ts|tsx)$' | grep -v test | xargs grep -n 'console\.log' || true)
if [ -n "$CONSOLE_LOGS" ]; then
    echo "⚠️  Warning: Found console.log statements:"
    echo "$CONSOLE_LOGS"
    echo "Consider removing or using proper logging."
fi

# Check for TODO/FIXME
echo "📋 Checking for TODO/FIXME..."
TODO_COUNT=$(git diff --cached | grep -E '^\+.*TODO|^\+.*FIXME' | wc -l || true)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "ℹ️  Found $TODO_COUNT new TODO/FIXME comments"
fi

# Run tests if they exist
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm run test || {
        echo "❌ Tests failed. Please fix before committing."
        exit 1
    }
fi

echo "✅ Pre-commit checks passed!"
exit 0
