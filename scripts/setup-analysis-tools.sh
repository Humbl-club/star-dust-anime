#!/bin/bash

echo "🔧 Setting up comprehensive code analysis tools for HUMBL Club Stardust..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create analysis directory
echo -e "${BLUE}Creating analysis directories...${NC}"
mkdir -p code-analysis-reports
mkdir -p code-analysis-reports/eslint
mkdir -p code-analysis-reports/typescript
mkdir -p code-analysis-reports/dependencies
mkdir -p code-analysis-reports/bundle
mkdir -p code-analysis-reports/security

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run analysis with error handling
run_analysis() {
    local name="$1"
    local command="$2"
    local output_file="$3"
    
    echo -e "${YELLOW}Running $name analysis...${NC}"
    if eval "$command" > "$output_file" 2>&1; then
        echo -e "${GREEN}✅ $name analysis completed${NC}"
    else
        echo -e "${RED}❌ $name analysis failed - check $output_file${NC}"
    fi
}

# ESLint Analysis
echo -e "${BLUE}Running ESLint analysis...${NC}"
if command_exists eslint; then
    run_analysis "ESLint" \
        "npx eslint src/ --ext .ts,.tsx --format json" \
        "code-analysis-reports/eslint/results.json"
    
    run_analysis "ESLint HTML Report" \
        "npx eslint src/ --ext .ts,.tsx --format html" \
        "code-analysis-reports/eslint/report.html"
else
    echo -e "${RED}ESLint not found. Please install it first.${NC}"
fi

# TypeScript Analysis
echo -e "${BLUE}Running TypeScript analysis...${NC}"
if command_exists tsc; then
    run_analysis "TypeScript Compilation" \
        "npx tsc --noEmit --listFiles" \
        "code-analysis-reports/typescript/compilation.log"
    
    run_analysis "TypeScript Types" \
        "npx tsc --listFiles --declaration --emitDeclarationOnly --outDir code-analysis-reports/typescript/types" \
        "code-analysis-reports/typescript/types.log"
else
    echo -e "${RED}TypeScript not found. Please install it first.${NC}"
fi

# Dependency Analysis
echo -e "${BLUE}Running dependency analysis...${NC}"
if command_exists madge; then
    run_analysis "Dependency Graph" \
        "npx madge --image code-analysis-reports/dependencies/graph.png src/" \
        "code-analysis-reports/dependencies/madge.log"
    
    run_analysis "Circular Dependencies" \
        "npx madge --circular src/" \
        "code-analysis-reports/dependencies/circular.txt"
fi

if command_exists depcruise; then
    run_analysis "Dependency Cruiser" \
        "npx depcruise --output-type json src/" \
        "code-analysis-reports/dependencies/cruiser.json"
fi

# Bundle Analysis
echo -e "${BLUE}Running bundle analysis...${NC}"
if [ -f "dist/index.html" ]; then
    if command_exists source-map-explorer; then
        run_analysis "Bundle Analysis" \
            "npx source-map-explorer dist/assets/*.js --html code-analysis-reports/bundle/bundle-analysis.html" \
            "code-analysis-reports/bundle/analysis.log"
    fi
else
    echo -e "${YELLOW}No build found. Running build first...${NC}"
    npm run build
fi

# Security Analysis
echo -e "${BLUE}Running security analysis...${NC}"
run_analysis "NPM Audit" \
    "npm audit --json" \
    "code-analysis-reports/security/npm-audit.json"

run_analysis "Package Vulnerabilities" \
    "npm audit --audit-level moderate" \
    "code-analysis-reports/security/vulnerabilities.txt"

# Code Metrics
echo -e "${BLUE}Generating code metrics...${NC}"
if command_exists cloc; then
    run_analysis "Lines of Code" \
        "cloc src/ --json" \
        "code-analysis-reports/metrics/cloc.json"
else
    echo -e "${YELLOW}cloc not installed. Generating basic metrics...${NC}"
    find src/ -name "*.ts" -o -name "*.tsx" | wc -l > code-analysis-reports/metrics/file-count.txt
    find src/ -name "*.ts" -o -name "*.tsx" -exec cat {} \; | wc -l > code-analysis-reports/metrics/line-count.txt
fi

# Generate Summary Report
echo -e "${BLUE}Generating summary report...${NC}"
cat > code-analysis-reports/summary.md << EOF
# HUMBL Club Stardust - Code Analysis Summary
Generated on: $(date)

## Analysis Results

### ESLint
- Results: [eslint/results.json](./eslint/results.json)
- HTML Report: [eslint/report.html](./eslint/report.html)

### TypeScript
- Compilation: [typescript/compilation.log](./typescript/compilation.log)
- Types: [typescript/types.log](./typescript/types.log)

### Dependencies
- Dependency Graph: [dependencies/graph.png](./dependencies/graph.png)
- Circular Dependencies: [dependencies/circular.txt](./dependencies/circular.txt)
- Dependency Cruiser: [dependencies/cruiser.json](./dependencies/cruiser.json)

### Bundle Analysis
- Bundle Analysis: [bundle/bundle-analysis.html](./bundle/bundle-analysis.html)

### Security
- NPM Audit: [security/npm-audit.json](./security/npm-audit.json)
- Vulnerabilities: [security/vulnerabilities.txt](./security/vulnerabilities.txt)

### Metrics
- Lines of Code: [metrics/cloc.json](./metrics/cloc.json)
- File Count: [metrics/file-count.txt](./metrics/file-count.txt)

## Next Steps
1. Review ESLint report for code quality issues
2. Check TypeScript compilation for type errors
3. Examine dependency graph for optimization opportunities
4. Address security vulnerabilities
5. Monitor bundle size for performance
EOF

echo -e "${GREEN}🎉 Code analysis setup completed!${NC}"
echo -e "${BLUE}📊 Check code-analysis-reports/ for detailed results${NC}"
echo -e "${BLUE}📋 Summary available at: code-analysis-reports/summary.md${NC}"

# Make the script executable
chmod +x scripts/setup-analysis-tools.sh