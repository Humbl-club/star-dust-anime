#!/usr/bin/env node

/**
 * Pre-deployment checklist script
 * Verifies that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Running pre-deployment checklist...\n');

const checks = [
  {
    name: 'Environment Configuration',
    check: () => {
      const envFile = path.join(__dirname, '../src/config/environment.ts');
      if (!fs.existsSync(envFile)) {
        throw new Error('Environment configuration file not found');
      }
      
      const content = fs.readFileSync(envFile, 'utf8');
      if (!content.includes('isDevelopment') || !content.includes('isProduction')) {
        throw new Error('Environment detection functions not found');
      }
      
      return '✅ Environment configuration is properly set up';
    }
  },
  {
    name: 'Supabase Configuration',
    check: () => {
      const clientFile = path.join(__dirname, '../src/integrations/supabase/client.ts');
      if (!fs.existsSync(clientFile)) {
        throw new Error('Supabase client configuration not found');
      }
      
      const content = fs.readFileSync(clientFile, 'utf8');
      if (!content.includes('createClient') || !content.includes('supabaseConfig')) {
        throw new Error('Supabase client not properly configured');
      }
      
      return '✅ Supabase client is properly configured';
    }
  },
  {
    name: 'React Query Configuration',
    check: () => {
      const queryFile = path.join(__dirname, '../src/lib/queryClient.ts');
      if (!fs.existsSync(queryFile)) {
        throw new Error('React Query configuration not found');
      }
      
      const content = fs.readFileSync(queryFile, 'utf8');
      if (!content.includes('QueryClient') || !content.includes('retry')) {
        throw new Error('React Query retry logic not configured');
      }
      
      return '✅ React Query is properly configured with retry logic';
    }
  },
  {
    name: 'Error Handling',
    check: () => {
      const errorFile = path.join(__dirname, '../src/lib/errorHandling.ts');
      const connectionFile = path.join(__dirname, '../src/lib/supabaseConnection.ts');
      
      if (!fs.existsSync(errorFile)) {
        throw new Error('Error handling module not found');
      }
      
      if (!fs.existsSync(connectionFile)) {
        throw new Error('Connection management module not found');
      }
      
      return '✅ Error handling and connection management are configured';
    }
  },
  {
    name: 'API Services',
    check: () => {
      const baseServiceFile = path.join(__dirname, '../src/services/api/baseService.ts');
      if (!fs.existsSync(baseServiceFile)) {
        throw new Error('Base API service not found');
      }
      
      const content = fs.readFileSync(baseServiceFile, 'utf8');
      if (!content.includes('connectionManager') || !content.includes('AppError')) {
        throw new Error('Enhanced API service features not implemented');
      }
      
      return '✅ API services are enhanced with error handling and retry logic';
    }
  }
];

let allPassed = true;

for (const check of checks) {
  try {
    const result = check.check();
    console.log(`${check.name}: ${result}`);
  } catch (error) {
    console.error(`❌ ${check.name}: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues before deploying.');
  process.exit(1);
}