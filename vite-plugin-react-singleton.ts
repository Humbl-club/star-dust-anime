// vite-plugin-react-singleton.ts
import type { Plugin } from 'vite';

export function reactSingleton(): Plugin {
  return {
    name: 'react-singleton',
    enforce: 'pre',
    config(config) {
      return {
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            // Force all React imports to resolve to the same file
            'react': require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
            'react/jsx-runtime': require.resolve('react/jsx-runtime'),
            'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
          },
        },
        optimizeDeps: {
          ...config.optimizeDeps,
          // Include React with proper externalization
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
          ],
          esbuildOptions: {
            ...config.optimizeDeps?.esbuildOptions,
            plugins: [
              {
                name: 'react-external',
                setup(build) {
                  // Intercept React imports and ensure they use the same instance
                  build.onResolve({ filter: /^react(-dom)?$/ }, (args) => {
                    return {
                      path: args.path,
                      namespace: 'react-ns',
                    };
                  });
                  
                  build.onLoad({ filter: /.*/, namespace: 'react-ns' }, (args) => {
                    return {
                      contents: `
                        export * from "${args.path}";
                        export { default } from "${args.path}";
                      `,
                      loader: 'js',
                    };
                  });
                },
              },
            ],
          },
        },
      };
    },
    transformIndexHtml(html) {
      // Inject React as a global before any other scripts
      return html.replace(
        '<script type="module" src="/src/main.tsx"></script>',
        `
        <script type="module">
          import * as React from 'react';
          import * as ReactDOM from 'react-dom';
          window.React = React;
          window.ReactDOM = ReactDOM;
        </script>
        <script type="module" src="/src/main.tsx"></script>
        `
      );
    },
  };
}