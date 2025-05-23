import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  {
    plugins: {
      next: nextPlugin,
    },
    extends: [
      'eslint:recommended',
    ],
    rules: {
      // Add any custom rules here
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      'plugin:@typescript-eslint/recommended',
    ],
  },
];

export default eslintConfig;
