#!/bin/bash

echo "🔍 CortexBuild Pro Structural Validation"
echo "======================================"

# Check dashboard pages
echo -e "\n📊 DASHBOARD PAGES VALIDATION"
echo "----------------------------------------"
dashboard_pages=("certifications" "notifications" "risk-assessments" "site-access" "toolbox-talks")
dashboard_passed=0

for page in "${dashboard_pages[@]}"; do
  if [ -d "app/(dashboard)/$page" ]; then
    echo -e "✅ $page"
    dashboard_passed=$((dashboard_passed + 1))
  else
    echo -e "❌ $page (missing)"
  fi
done

echo -e "\n📈 Dashboard Pages: $dashboard_passed/${#dashboard_pages[@]} passed"

# Check API routes
echo -e "\n🔌 API INTEGRATIONS VALIDATION"
echo "----------------------------------------"
api_routes=("ai" "notifications" "upload" "webhooks")
api_passed=0

for route in "${api_routes[@]}"; do
  if [ -d "app/api/$route" ]; then
    echo -e "✅ $route"
    api_passed=$((api_passed + 1))
  else
    echo -e "❌ $route (missing)"
  fi
done

echo -e "\n📈 API Integrations: $api_passed/${#api_routes[@]} passed"

# Check core files
echo -e "\n📁 CORE FILES VALIDATION"
echo "----------------------------------------"
core_files=("app/layout.tsx" "app/(dashboard)/layout.tsx" "lib/db.ts" "lib/types.ts" "hooks/use-toast.ts")
core_passed=0

for file in "${core_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "✅ $file"
    core_passed=$((core_passed + 1))
  else
    echo -e "❌ $file (missing)"
  fi
done

echo -e "\n📈 Core Files: $core_passed/${#core_files[@]} passed"

# Summary
echo -e "\n🎯 VALIDATION SUMMARY"
echo "----------------------------------------"
total_possible=$(( ${#dashboard_pages[@]} + ${#api_routes[@]} + ${#core_files[@]} ))
total_passed=$((dashboard_passed + api_passed + core_passed))

echo -e "Overall: $total_passed/$total_possible checks passed"

if [ $total_passed -eq $total_possible ]; then
  echo -e "🎉 All validations passed! Core features appear to be intact."
  exit 0
else
  echo -e "⚠️  Some validations failed. Please review the missing items above."
  exit 1
fi