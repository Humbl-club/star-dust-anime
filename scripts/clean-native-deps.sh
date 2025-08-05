#!/bin/bash

echo "🧹 Cleaning problematic native dependencies..."

# First, try to remove problematic packages individually
echo "Attempting to remove problematic packages..."
npm uninstall bundlesize dependency-cruiser madge npm-check rollup-plugin-visualizer source-map-explorer vite-bundle-visualizer webpack-bundle-analyzer 2>/dev/null || true

# Remove node_modules and lock files to force clean install
echo "Removing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb
rm -f yarn.lock

# Clear all package manager caches
echo "Clearing all caches..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true

# Remove any global cache that might interfere
rm -rf ~/.npm/_cacache 2>/dev/null || true
rm -rf ~/.cache/bun 2>/dev/null || true

# Install clean dependencies
echo "Installing clean dependencies..."
npm install

echo "✅ Native dependencies cleaned successfully!"