import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Existing animation/demo components are JavaScript and intentionally use
      // flexible props; TypeScript covers the application-facing code.
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // R3F/Three.js components intentionally mutate scene objects and refs in
      // the render loop. These compiler-oriented rules produce false positives
      // for imperative WebGL APIs; exhaustive-deps remains enabled.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'android/**',
    'ios/**',
    'www/**',
    '*.config.js',
    '*.config.mjs',
  ]),
])
