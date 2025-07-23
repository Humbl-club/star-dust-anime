const fs = require('fs');
const path = require('path');

try {
  // Check package-lock.json for multiple React versions
  const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

  const findReactVersions = (obj, versions = new Set(), currentPath = '') => {
    for (const key in obj) {
      if (key === 'react' || key === 'react-dom') {
        if (obj[key].version) {
          versions.add(`${currentPath}${key}@${obj[key].version}`);
        }
      }
      if (obj[key] && typeof obj[key] === 'object') {
        findReactVersions(obj[key], versions, currentPath + key + ' > ');
      }
    }
    return Array.from(versions);
  };

  console.log('=== React Version Analysis ===');
  console.log('React versions found:');
  const versions = findReactVersions(packageLock);
  versions.forEach(version => console.log('  -', version));
  
  if (versions.length > 2) {
    console.log('\n⚠️  WARNING: Multiple React versions detected!');
    console.log('This can cause "Cannot read properties of null" errors.');
  } else {
    console.log('\n✅ React versions look clean');
  }
} catch (error) {
  console.log('Could not analyze package-lock.json:', error.message);
}

// Check current dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('\n=== Current React Dependencies ===');
  console.log('react:', packageJson.dependencies?.react || 'Not found');
  console.log('react-dom:', packageJson.dependencies?.['react-dom'] || 'Not found');
  console.log('@types/react:', packageJson.dependencies?.['@types/react'] || packageJson.devDependencies?.['@types/react'] || 'Not found');
  console.log('@types/react-dom:', packageJson.dependencies?.['@types/react-dom'] || packageJson.devDependencies?.['@types/react-dom'] || 'Not found');
} catch (error) {
  console.log('Could not read package.json:', error.message);
}