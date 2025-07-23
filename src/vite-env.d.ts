/// <reference types="vite/client" />

declare module 'react' {
  export = React;
  export as namespace React;
}

declare global {
  const React: typeof import('react');
  const ReactDOM: typeof import('react-dom');
}

interface ImportMetaEnv {
  readonly VITE_OPTIMIZE_DEPS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}