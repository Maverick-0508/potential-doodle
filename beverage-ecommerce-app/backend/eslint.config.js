import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn', // Changed from error to warning for development
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.test.{js,mjs,cjs}', '**/__tests__/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    }
  }
];