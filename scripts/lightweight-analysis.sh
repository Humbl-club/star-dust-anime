#!/bin/bash

# ================================================================
# LIGHTWEIGHT CODE ANALYSIS - No Native Dependencies Required
# ================================================================

echo "🔍 Running Lightweight Code Analysis..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="ANALYSIS_REPORT_$TIMESTAMP.md"

# Initialize report
cat > $REPORT << 'EOF'
# Code Analysis Report - HUMBL Club Stardust
================================================================

## Quick Summary
EOF

echo "" >> $REPORT
date >> $REPORT
echo "" >> $REPORT

# ================================================================
# 1. TypeScript Analysis (Built-in, no extra deps)
# ================================================================
echo "📝 Analyzing TypeScript..."
echo "## TypeScript Compilation Check" >> $REPORT
echo '```' >> $REPORT

# Count TypeScript errors
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
echo "TypeScript Errors Found: $TSC_ERRORS" >> $REPORT

if [ "$TSC_ERRORS" -gt "0" ]; then
    echo "" >> $REPORT
    echo "First 20 errors:" >> $REPORT
    echo "$TSC_OUTPUT" | grep "error TS" | head -20 >> $REPORT
fi
echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 2. ESLint Analysis (Already installed)
# ================================================================
echo "📋 Analyzing with ESLint..."
echo "## ESLint Analysis" >> $REPORT
echo '```' >> $REPORT

# Get ESLint statistics
ESLINT_OUTPUT=$(npx eslint src --format compact 2>&1 || true)
ESLINT_ERRORS=$(echo "$ESLINT_OUTPUT" | grep -oE '[0-9]+ errors' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0")
ESLINT_WARNINGS=$(echo "$ESLINT_OUTPUT" | grep -oE '[0-9]+ warnings' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0")

echo "ESLint Errors: $ESLINT_ERRORS" >> $REPORT
echo "ESLint Warnings: $ESLINT_WARNINGS" >> $REPORT
echo "" >> $REPORT
echo "Sample issues:" >> $REPORT
echo "$ESLINT_OUTPUT" | head -10 >> $REPORT
echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 3. Code Statistics (Using basic Unix tools)
# ================================================================
echo "📊 Calculating code statistics..."
echo "## Code Statistics" >> $REPORT
echo '```' >> $REPORT

# Count files and lines
echo "File Counts:" >> $REPORT
find src -name "*.tsx" -type f | wc -l | xargs echo "  React Components (.tsx):" >> $REPORT
find src -name "*.ts" -type f | wc -l | xargs echo "  TypeScript Files (.ts):" >> $REPORT
find src -name "*.css" -o -name "*.scss" -type f | wc -l | xargs echo "  Style Files:" >> $REPORT

echo "" >> $REPORT
echo "Lines of Code:" >> $REPORT
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1 | awk '{print "  Total TypeScript: " $1}' >> $REPORT
find src/components -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print "  Components: " $1}' >> $REPORT
find src/hooks -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print "  Hooks: " $1}' >> $REPORT
find src/services -name "*.ts" | xargs wc -l 2>/dev/null | tail -1 | awk '{print "  Services: " $1}' >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 4. Pattern Detection (Using grep)
# ================================================================
echo "🔎 Detecting code patterns..."
echo "## Code Pattern Analysis" >> $REPORT
echo '```' >> $REPORT

echo "Common Issues:" >> $REPORT
grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  TODO/FIXME comments:" >> $REPORT
grep -r "console\." src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  Console statements:" >> $REPORT
grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  'any' type usage:" >> $REPORT
grep -r "eslint-disable" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  ESLint disabled:" >> $REPORT
grep -r "ts-ignore\|ts-expect-error" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  TS suppressions:" >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 5. Dependency Check (Using npm built-ins)
# ================================================================
echo "📦 Checking dependencies..."
echo "## Dependency Analysis" >> $REPORT
echo '```' >> $REPORT

echo "Package Statistics:" >> $REPORT
npm ls --depth=0 2>/dev/null | grep -c "^├\|^└" | xargs echo "  Direct dependencies:" >> $REPORT
npm ls --production --depth=0 2>/dev/null | grep -c "^├\|^└" | xargs echo "  Production dependencies:" >> $REPORT
npm ls --dev --depth=0 2>/dev/null | grep -c "^├\|^└" | xargs echo "  Dev dependencies:" >> $REPORT

echo "" >> $REPORT
echo "Outdated Packages:" >> $REPORT
npm outdated 2>/dev/null | head -10 >> $REPORT || echo "  All packages up to date" >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 6. Security Audit (npm built-in)
# ================================================================
echo "🔒 Running security audit..."
echo "## Security Audit" >> $REPORT
echo '```' >> $REPORT

npm audit --audit-level=moderate 2>&1 | grep -E "found|vulnerabilities" | head -5 >> $REPORT || echo "No vulnerabilities found" >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 7. Database Schema Quick Check
# ================================================================
echo "🗄️ Checking database..."
echo "## Database Overview" >> $REPORT
echo '```' >> $REPORT

if [ -d "supabase/migrations" ]; then
    ls supabase/migrations/*.sql 2>/dev/null | wc -l | xargs echo "Migration files:" >> $REPORT
    echo "Recent migrations:" >> $REPORT
    ls -t supabase/migrations/*.sql 2>/dev/null | head -5 | xargs -n1 basename >> $REPORT
else
    echo "No migrations directory found" >> $REPORT
fi

if [ -d "supabase/functions" ]; then
    echo "" >> $REPORT
    echo "Edge Functions:" >> $REPORT
    ls -d supabase/functions/*/ 2>/dev/null | wc -l | xargs echo "  Total functions:" >> $REPORT
    ls -d supabase/functions/*/ 2>/dev/null | head -5 | xargs -n1 basename | sed 's/^/  - /' >> $REPORT
fi

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 8. Top Issues to Fix
# ================================================================
echo "## 🎯 Priority Issues" >> $REPORT
echo "" >> $REPORT

if [ "$TSC_ERRORS" -gt "0" ]; then
    echo "1. **Fix TypeScript Errors** ($TSC_ERRORS errors)" >> $REPORT
fi

if [ "$ESLINT_ERRORS" -gt "0" ]; then
    echo "2. **Fix ESLint Errors** ($ESLINT_ERRORS errors)" >> $REPORT
fi

echo "3. **Review TODO/FIXME comments**" >> $REPORT
echo "4. **Remove console statements for production**" >> $REPORT
echo "5. **Replace 'any' types with proper types**" >> $REPORT

echo "" >> $REPORT
echo "---" >> $REPORT
echo "Report generated: $(date)" >> $REPORT

# ================================================================
# Complete
# ================================================================
echo ""
echo "✅ Analysis Complete!"
echo "📄 Report saved to: $REPORT"
echo ""
echo "To view: cat $REPORT"
echo "To share: Upload $REPORT to project knowledge"

# Make script executable
chmod +x scripts/lightweight-analysis.sh