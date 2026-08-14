import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import gitignore from 'eslint-config-flat-gitignore'
import pluginJsonc from 'eslint-plugin-jsonc'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default await withVueTs(
  gitignore(),
  eslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...pluginJsonc.configs['flat/base'],
  {
    files: ['**/*.{json,jsonc,json5}'],
    rules: {
      'jsonc/no-dupe-keys': 'error',
    },
  },
  {
    files: ['**/*.json'],
    ignores: ['**/tsconfig*.json', '**/.vscode/*.json'],
    rules: {
      'jsonc/no-comments': 'error',
    },
  },
  {
    files: ['**/*.jsonc', '**/tsconfig*.json', '**/.vscode/*.json'],
    rules: {
      'jsonc/no-comments': 'off',
    },
  },
  {
    ignores: [
      'playground/**',
      'realworld/**',
      '.codebase-memory/**',
      '.omx/**',
    ],
  },
  ...pluginOxlint.configs['flat/recommended'],
  eslintConfigPrettier,
)
