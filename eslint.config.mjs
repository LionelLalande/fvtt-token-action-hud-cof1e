import globals from 'globals';
import PluginImport from 'eslint-plugin-import';
import PluginJest from 'eslint-plugin-jest';
import PluginTypescriptEsLint from 'typescript-eslint';
import ParserTypescriptEslint from '@typescript-eslint/parser';
import tsConfig from './tsconfig.eslint.json' with { type: 'json' };

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  eslint.configs.recommended,
  ...tseslint.configs.recommended, // TypeChecked
  ...tseslint.configs.strict, // TypeChecked
  ...tseslint.configs.stylistic, // TypeChecked
  {
    files: ['src/**/*.ts'],
    ignores: tsConfig.exclude,
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  //{
  //  rules: {
  //    // turns a rule on with no configuration (i.e. uses the default configuration)
  //    '@typescript-eslint/array-type': 'error',
  //    // turns on a rule with configuration
  //    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
  //  },
  //},
]);

////export default [
////  {
////    files: ["src/**/*.ts"],
////    ignores: tsConfig.exclude,
////    languageOptions: {
////      globals: {
////        ...globals.browser,
////        ...globals.es2022,
////      },
////      parser: ParserTypescriptEslint,
////      parserOptions: {
////        ecmaVersion: 2020,
////        sourceType: 'module',
////        project: './tsconfig.eslint.json',
////      }
////    },
////    plugins: {
////      import: PluginImport,
////      jest: PluginJest
////    },
////    rules: {
////      'no-unused-vars': [
////        'error',
////        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', varsIgnorePattern: '^_' },
////      ],
////      semi: "error"
////    },
////    settings: {
////      "import/resolver": {
////        ...PluginImport.configs.typescript.settings['import/resolver'],
////        typescript: {
////          project: ["tsconfig.json"],
////        },
////      },
////    },
////    ...PluginJest.configs['flat/recommended'],
////    ...PluginJest.configs['flat/style'],
////    ...PluginTypescriptEsLint.configs.recommendedTypeChecked,
////    //PluginTypescriptEsLint.configs.stylisticTypeChecked,
////  },
////  {
////  },
////];
