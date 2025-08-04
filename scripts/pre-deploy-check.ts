import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  passed: boolean;
  message: string;
  details?: string;
}

class PreDeploymentChecker {
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async runAllChecks(): Promise<void> {
    console.log('🚀 Running pre-deployment checks...\n');
    
    const checks = {
      environment: this.checkEnvironmentVariables(),
      typescript: await this.checkTypeScript(),
      lint: await this.checkLinting(),
      build: await this.checkBuild(),
      tests: await this.runTests(),
      security: this.checkSecurity(),
      dependencies: this.checkDependencies(),
      configuration: this.checkConfiguration()
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const results = Object.entries(checks);
    const passed = results.filter(([_, result]) => result.passed).length;
    const total = results.length;

    results.forEach(([name, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${name.toUpperCase()}: ${result.message}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    
    if (passed === total) {
      console.log(`🎉 All ${total} checks passed! Ready for deployment.`);
      process.exit(0);
    } else {
      console.log(`❌ ${total - passed} of ${total} checks failed. Please fix issues before deploying.`);
      process.exit(1);
    }
  }

  private checkEnvironmentVariables(): CheckResult {
    try {
      const envFile = join(this.projectRoot, 'src/config/environment.ts');
      
      if (!existsSync(envFile)) {
        return {
          passed: false,
          message: 'Environment configuration file not found',
          details: 'src/config/environment.ts is missing'
        };
      }

      const content = readFileSync(envFile, 'utf8');
      
      const requiredChecks = [
        { check: content.includes('EnvironmentManager'), name: 'EnvironmentManager class' },
        { check: content.includes('supabase'), name: 'Supabase configuration' },
        { check: content.includes('isDevelopment'), name: 'Development detection' },
        { check: content.includes('isProduction'), name: 'Production detection' },
        { check: content.includes('getSupabaseConfig'), name: 'Supabase config getter' }
      ];

      const missing = requiredChecks.filter(item => !item.check);
      
      if (missing.length > 0) {
        return {
          passed: false,
          message: 'Environment configuration incomplete',
          details: `Missing: ${missing.map(m => m.name).join(', ')}`
        };
      }

      return {
        passed: true,
        message: 'Environment configuration is properly set up'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Environment check failed',
        details: (error as Error).message
      };
    }
  }

  private async checkTypeScript(): Promise<CheckResult> {
    try {
      console.log('🔍 Checking TypeScript compilation...');
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      return {
        passed: true,
        message: 'TypeScript compilation successful'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'TypeScript compilation failed',
        details: 'Run `npx tsc --noEmit` for detailed errors'
      };
    }
  }

  private async checkLinting(): Promise<CheckResult> {
    try {
      console.log('🔍 Running ESLint checks...');
      execSync('npx eslint . --ext .ts,.tsx --max-warnings 0', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      return {
        passed: true,
        message: 'ESLint checks passed'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'ESLint checks failed',
        details: 'Run `npx eslint . --ext .ts,.tsx` for detailed errors'
      };
    }
  }

  private async checkBuild(): Promise<CheckResult> {
    try {
      console.log('🔍 Testing production build...');
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      // Check if dist directory was created
      const distPath = join(this.projectRoot, 'dist');
      if (!existsSync(distPath)) {
        return {
          passed: false,
          message: 'Build completed but dist directory not found'
        };
      }
      
      return {
        passed: true,
        message: 'Production build successful'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Production build failed',
        details: 'Run `npm run build` for detailed errors'
      };
    }
  }

  private async runTests(): Promise<CheckResult> {
    try {
      // Check if test files exist
      const testFiles = [
        'tests',
        'src/__tests__',
        'src/**/*.test.ts',
        'src/**/*.test.tsx'
      ];

      let hasTests = false;
      for (const testPath of testFiles) {
        if (existsSync(join(this.projectRoot, testPath))) {
          hasTests = true;
          break;
        }
      }

      if (!hasTests) {
        return {
          passed: true,
          message: 'No tests found (skipped)',
          details: 'Consider adding tests for better code quality'
        };
      }

      console.log('🔍 Running tests...');
      execSync('npm test', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      return {
        passed: true,
        message: 'All tests passed'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Tests failed',
        details: 'Run `npm test` for detailed errors'
      };
    }
  }

  private checkSecurity(): CheckResult {
    try {
      const criticalFiles = [
        'src/integrations/supabase/client.ts',
        'src/lib/errorHandling.ts',
        'src/services/api/baseService.ts'
      ];

      const missingFiles = criticalFiles.filter(file => 
        !existsSync(join(this.projectRoot, file))
      );

      if (missingFiles.length > 0) {
        return {
          passed: false,
          message: 'Critical security files missing',
          details: `Missing: ${missingFiles.join(', ')}`
        };
      }

      // Check for hardcoded secrets (basic check)
      const supabaseClient = readFileSync(
        join(this.projectRoot, 'src/integrations/supabase/client.ts'), 
        'utf8'
      );

      if (supabaseClient.includes('YOUR_') || supabaseClient.includes('your_')) {
        return {
          passed: false,
          message: 'Potential hardcoded placeholders found',
          details: 'Check Supabase configuration for placeholder values'
        };
      }

      return {
        passed: true,
        message: 'Security checks passed'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Security check failed',
        details: (error as Error).message
      };
    }
  }

  private checkDependencies(): CheckResult {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      
      if (!existsSync(packageJsonPath)) {
        return {
          passed: false,
          message: 'package.json not found'
        };
      }

      console.log('🔍 Checking for dependency vulnerabilities...');
      
      try {
        execSync('npm audit --audit-level=high', { 
          stdio: 'pipe',
          cwd: this.projectRoot 
        });
      } catch (auditError) {
        return {
          passed: false,
          message: 'High/critical vulnerabilities found',
          details: 'Run `npm audit` to see details and `npm audit fix` to resolve'
        };
      }

      return {
        passed: true,
        message: 'No high/critical vulnerabilities found'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Dependency check failed',
        details: (error as Error).message
      };
    }
  }

  private checkConfiguration(): CheckResult {
    try {
      const configFiles = [
        { path: 'src/lib/queryClient.ts', name: 'React Query configuration' },
        { path: 'src/config/environment.ts', name: 'Environment configuration' },
        { path: 'src/lib/supabaseConnection.ts', name: 'Supabase connection management' }
      ];

      const missingConfigs = configFiles.filter(config => 
        !existsSync(join(this.projectRoot, config.path))
      );

      if (missingConfigs.length > 0) {
        return {
          passed: false,
          message: 'Configuration files missing',
          details: `Missing: ${missingConfigs.map(c => c.name).join(', ')}`
        };
      }

      return {
        passed: true,
        message: 'All configuration files present'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Configuration check failed',
        details: (error as Error).message
      };
    }
  }
}

// Run the pre-deployment check
async function preDeploymentCheck(): Promise<void> {
  const checker = new PreDeploymentChecker();
  await checker.runAllChecks();
}

// Execute if run directly
if (require.main === module) {
  preDeploymentCheck().catch((error) => {
    console.error('❌ Pre-deployment check failed:', error);
    process.exit(1);
  });
}

export { preDeploymentCheck, PreDeploymentChecker };