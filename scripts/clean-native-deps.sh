#!/bin/bash

echo "🧹 Cleaning problematic native dependencies..."

# Remove node_modules and package-lock.json to force clean install
echo "Removing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb

# Remove any cached data
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Remove problematic packages from package.json directly if they still exist
echo "Cleaning package.json of problematic dependencies..."
if [ -f package.json ]; then
    # Create a backup
    cp package.json package.json.backup
    
    # Remove problematic dependencies using sed
    sed -i '/"bundlesize"/d' package.json
    sed -i '/"dependency-cruiser"/d' package.json
    sed -i '/"madge"/d' package.json
    sed -i '/"npm-check"/d' package.json
    sed -i '/"rollup-plugin-visualizer"/d' package.json
    sed -i '/"source-map-explorer"/d' package.json
    sed -i '/"vite-bundle-visualizer"/d' package.json
    sed -i '/"webpack-bundle-analyzer"/d' package.json
    sed -i '/"iltorb"/d' package.json
    sed -i '/"brotli-size"/d' package.json
    
    echo "✅ Cleaned package.json"
fi

# Install clean dependencies
echo "Installing clean dependencies..."
npm install

echo "✅ Native dependencies cleaned successfully!"