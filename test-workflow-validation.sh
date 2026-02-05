#!/bin/bash
# Test script to validate the deploy-vps.yml workflow validation logic

set -e

echo "🧪 Testing deploy-vps.yml workflow validation..."
echo ""

# Test 1: Validate YAML syntax
echo "Test 1: Validating YAML syntax..."
if python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-vps.yml'))" 2>&1; then
    echo "✅ YAML syntax is valid"
else
    echo "❌ YAML syntax validation failed"
    exit 1
fi
echo ""

# Test 2: Check validation step exists
echo "Test 2: Checking validation step exists..."
if grep -q "name: Validate required secrets" .github/workflows/deploy-vps.yml; then
    echo "✅ Validation step found in workflow"
else
    echo "❌ Validation step not found"
    exit 1
fi
echo ""

# Test 3: Check validation logic for VPS_HOST
echo "Test 3: Checking VPS_HOST validation..."
if grep -q 'if \[ -z "\${{ secrets.VPS_HOST }}" \]' .github/workflows/deploy-vps.yml; then
    echo "✅ VPS_HOST validation found"
else
    echo "❌ VPS_HOST validation not found"
    exit 1
fi
echo ""

# Test 4: Check validation logic for VPS_USER
echo "Test 4: Checking VPS_USER validation..."
if grep -q 'if \[ -z "\${{ secrets.VPS_USER }}" \]' .github/workflows/deploy-vps.yml; then
    echo "✅ VPS_USER validation found"
else
    echo "❌ VPS_USER validation not found"
    exit 1
fi
echo ""

# Test 5: Check validation logic for VPS_SSH_KEY
echo "Test 5: Checking VPS_SSH_KEY validation..."
if grep -q 'if \[ -z "\${{ secrets.VPS_SSH_KEY }}" \]' .github/workflows/deploy-vps.yml; then
    echo "✅ VPS_SSH_KEY validation found"
else
    echo "❌ VPS_SSH_KEY validation not found"
    exit 1
fi
echo ""

# Test 6: Check validation step runs before SSH setup
echo "Test 6: Checking validation runs before SSH setup..."
VALIDATION_LINE=$(grep -n "name: Validate required secrets" .github/workflows/deploy-vps.yml | cut -d: -f1)
SSH_SETUP_LINE=$(grep -n "name: Setup SSH" .github/workflows/deploy-vps.yml | cut -d: -f1)

if [ "$VALIDATION_LINE" -lt "$SSH_SETUP_LINE" ]; then
    echo "✅ Validation step runs before SSH setup (line $VALIDATION_LINE < $SSH_SETUP_LINE)"
else
    echo "❌ Validation step should run before SSH setup"
    exit 1
fi
echo ""

# Test 7: Check error message is helpful
echo "Test 7: Checking error message quality..."
if grep -q "Please configure these secrets in your repository settings" .github/workflows/deploy-vps.yml; then
    echo "✅ Helpful error message found"
else
    echo "❌ Error message could be improved"
    exit 1
fi
echo ""

# Test 8: Check documentation consistency
echo "Test 8: Checking documentation uses VPS_USER (not VPS_USERNAME)..."
if ! grep -q "VPS_USERNAME" GITHUB_SECRETS_GUIDE.md; then
    echo "✅ GITHUB_SECRETS_GUIDE.md uses VPS_USER consistently"
else
    echo "❌ GITHUB_SECRETS_GUIDE.md still has VPS_USERNAME references"
    exit 1
fi
echo ""

# Test 9: Verify ssh-keyscan is still present (after validation)
echo "Test 9: Checking ssh-keyscan command is still present..."
if grep -q "ssh-keyscan -H \${{ secrets.VPS_HOST }}" .github/workflows/deploy-vps.yml; then
    echo "✅ ssh-keyscan command found"
else
    echo "❌ ssh-keyscan command not found"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ All tests passed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- YAML syntax is valid"
echo "- Validation step exists and runs before SSH setup"
echo "- All three secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY) are validated"
echo "- Error messages are helpful and reference documentation"
echo "- Documentation is consistent with workflow"
echo ""
echo "The workflow will now fail early with a clear error message"
echo "if any required VPS secrets are missing, instead of showing"
echo "the confusing 'ssh-keyscan usage' error."
