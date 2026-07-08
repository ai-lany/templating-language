import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@your-org/design-system'],
  // CSS Modules are extracted to dist/index.css. Consumers must also import the
  // design system's own CSS (`@your-org/design-system/dist/index.css`) for tokens.
});
