import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { build } from 'vite';

async function analyzeBuild() {
  console.log('Building for production analysis...');
  
  await build({
    build: {
      rollupOptions: {
        plugins: [
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: true,
            generateStatsFile: true,
            statsFilename: 'bundle-stats.json'
          })
        ]
      }
    }
  });
}

analyzeBuild().catch(console.error);