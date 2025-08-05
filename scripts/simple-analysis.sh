#!/bin/bash

# ================================================================
# ULTIMATE SIMPLE CODE ANALYSIS - Zero Dependencies
# Uses only built-in Unix tools and existing project packages
# ================================================================

echo "🚀 Running Ultimate Simple Code Analysis for HUMBL Club Stardust..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="CODE_ANALYSIS_SIMPLE_$TIMESTAMP.md"

# ================================================================
# Initialize Report
# ================================================================
cat > $REPORT << 'EOF'
# HUMBL Club Stardust - Simple Code Analysis
===============================================

## Executive Summary
This analysis uses only built-in tools and existing project dependencies.

EOF

echo "**Generated:** $(date)" >> $REPORT
echo "" >> $REPORT

# ================================================================
# 1. Project Overview
# ================================================================
echo "📊 Gathering project overview..."
echo "## 🏗️ Project Structure" >> $REPORT
echo '```' >> $REPORT
echo "Total directories: $(find src -type d | wc -l)" >> $REPORT
echo "Total files: $(find src -type f | wc -l)" >> $REPORT
echo "" >> $REPORT

echo "File breakdown:" >> $REPORT
find src -name "*.tsx" | wc -l | xargs echo "  React Components (.tsx):" >> $REPORT
find src -name "*.ts" | wc -l | xargs echo "  TypeScript files (.ts):" >> $REPORT
find src -name "*.css" | wc -l | xargs echo "  CSS files:" >> $REPORT
find src -name "*.json" | wc -l | xargs echo "  JSON files:" >> $REPORT

echo "" >> $REPORT
echo "Key directories:" >> $REPORT
[ -d "src/components" ] && find src/components -name "*.tsx" | wc -l | xargs echo "  Components:" >> $REPORT
[ -d "src/hooks" ] && find src/hooks -name "*.ts" -o -name "*.tsx" | wc -l | xargs echo "  Hooks:" >> $REPORT
[ -d "src/pages" ] && find src/pages -name "*.tsx" | wc -l | xargs echo "  Pages:" >> $REPORT
[ -d "src/services" ] && find src/services -name "*.ts" | wc -l | xargs echo "  Services:" >> $REPORT
[ -d "src/utils" ] && find src/utils -name "*.ts" | wc -l | xargs echo "  Utils:" >> $REPORT
[ -d "src/types" ] && find src/types -name "*.ts" | wc -l | xargs echo "  Types:" >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 2. Code Quality Quick Check
# ================================================================
echo "🔍 Checking code quality indicators..."
echo "## 🎯 Code Quality Indicators" >> $REPORT
echo '```' >> $REPORT

# Count potential issues
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
CONSOLE_COUNT=$(grep -r "console\." src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
ANY_TYPE_COUNT=$(grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
ESLINT_DISABLE_COUNT=$(grep -r "eslint-disable" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

echo "Code Quality Metrics:" >> $REPORT
echo "  TODO/FIXME/HACK comments: $TODO_COUNT" >> $REPORT
echo "  Console statements: $CONSOLE_COUNT" >> $REPORT
echo "  'any' type usage: $ANY_TYPE_COUNT" >> $REPORT
echo "  ESLint disable comments: $ESLINT_DISABLE_COUNT" >> $REPORT

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 3. Component Analysis
# ================================================================
echo "🧩 Analyzing components..."
echo "## 📦 Component Analysis" >> $REPORT
echo '```' >> $REPORT

echo "Component Structure:" >> $REPORT
if [ -d "src/components" ]; then
    find src/components -name "*.tsx" | head -20 | while read file; do
        basename "$file" .tsx | sed 's/^/  - /' >> $REPORT
    done
    
    TOTAL_COMPONENTS=$(find src/components -name "*.tsx" | wc -l)
    if [ "$TOTAL_COMPONENTS" -gt 20 ]; then
        echo "  ... and $((TOTAL_COMPONENTS - 20)) more components" >> $REPORT
    fi
else
    echo "  No components directory found" >> $REPORT
fi

echo "" >> $REPORT
echo "Page Components:" >> $REPORT
if [ -d "src/pages" ]; then
    find src/pages -name "*.tsx" | while read file; do
        basename "$file" .tsx | sed 's/^/  - /' >> $REPORT
    done
else
    echo "  No pages directory found" >> $REPORT
fi

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 4. Dependencies Overview
# ================================================================
echo "📋 Analyzing dependencies..."
echo "## 📚 Dependencies Overview" >> $REPORT
echo '```' >> $REPORT

if [ -f "package.json" ]; then
    echo "Package.json analysis:" >> $REPORT
    
    # Count dependencies
    PROD_DEPS=$(grep -c '".*":' package.json || echo "0")
    echo "  Total package entries: $PROD_DEPS" >> $REPORT
    
    # Key frameworks
    echo "" >> $REPORT
    echo "Key Dependencies:" >> $REPORT
    grep -E '"react"|"typescript"|"vite"|"supabase"|"tailwind"' package.json | sed 's/^[[:space:]]*/  /' >> $REPORT
    
else
    echo "No package.json found" >> $REPORT
fi

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 5. Database/Backend Analysis
# ================================================================
echo "🗄️ Analyzing backend setup..."
echo "## 🗄️ Backend & Database" >> $REPORT
echo '```' >> $REPORT

echo "Supabase Integration:" >> $REPORT
if [ -d "supabase" ]; then
    echo "  ✅ Supabase directory exists" >> $REPORT
    
    if [ -d "supabase/migrations" ]; then
        MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
        echo "  📊 Migration files: $MIGRATION_COUNT" >> $REPORT
        
        if [ "$MIGRATION_COUNT" -gt 0 ]; then
            echo "  Recent migrations:" >> $REPORT
            ls -t supabase/migrations/*.sql 2>/dev/null | head -3 | while read file; do
                basename "$file" | sed 's/^/    - /' >> $REPORT
            done
        fi
    fi
    
    if [ -d "supabase/functions" ]; then
        FUNCTION_COUNT=$(ls -d supabase/functions/*/ 2>/dev/null | wc -l)
        echo "  ⚡ Edge functions: $FUNCTION_COUNT" >> $REPORT
        
        if [ "$FUNCTION_COUNT" -gt 0 ]; then
            echo "  Available functions:" >> $REPORT
            ls -d supabase/functions/*/ 2>/dev/null | head -5 | while read dir; do
                basename "$dir" | sed 's/^/    - /' >> $REPORT
            done
        fi
    fi
else
    echo "  ❌ No supabase directory found" >> $REPORT
fi

echo '```' >> $REPORT
echo "" >> $REPORT

# ================================================================
# 6. Quick Recommendations
# ================================================================
echo "## 🎯 Quick Recommendations" >> $REPORT
echo "" >> $REPORT

if [ "$TODO_COUNT" -gt 0 ]; then
    echo "1. **Address TODO items** ($TODO_COUNT found)" >> $REPORT
fi

if [ "$CONSOLE_COUNT" -gt 5 ]; then
    echo "2. **Remove console statements** ($CONSOLE_COUNT found - should be minimal for production)" >> $REPORT
fi

if [ "$ANY_TYPE_COUNT" -gt 10 ]; then
    echo "3. **Improve TypeScript typing** ($ANY_TYPE_COUNT 'any' types found)" >> $REPORT
fi

echo "4. **Run TypeScript compiler** (\`npx tsc --noEmit\` to check for errors)" >> $REPORT
echo "5. **Run ESLint** (\`npx eslint src\` for code quality checks)" >> $REPORT

# ================================================================
# 7. Next Steps
# ================================================================
echo "" >> $REPORT
echo "## 🚀 Next Steps" >> $REPORT
echo "" >> $REPORT
echo "### Quick Commands to Run:" >> $REPORT
echo '```bash' >> $REPORT
echo "# Check TypeScript compilation" >> $REPORT
echo "npx tsc --noEmit" >> $REPORT
echo "" >> $REPORT
echo "# Check code quality with ESLint" >> $REPORT
echo "npx eslint src --ext .ts,.tsx" >> $REPORT
echo "" >> $REPORT
echo "# Build the project" >> $REPORT
echo "npm run build" >> $REPORT
echo '```' >> $REPORT

echo "" >> $REPORT
echo "---" >> $REPORT
echo "*Analysis completed: $(date)*" >> $REPORT

# ================================================================
# Complete
# ================================================================
echo ""
echo "✅ Simple Analysis Complete!"
echo "📄 Report saved to: $REPORT"
echo ""
echo "🔍 Key findings:"
echo "   - Components: $(find src/components -name "*.tsx" 2>/dev/null | wc -l)"
echo "   - TODO items: $TODO_COUNT"
echo "   - Console statements: $CONSOLE_COUNT"
echo ""
echo "📖 To view full report: cat $REPORT"

chmod +x scripts/simple-analysis.sh
echo ""
echo "Script is now executable! Run again with: ./scripts/simple-analysis.sh"