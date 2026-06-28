const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: ['src/styles/**/*.js', 'node_modules/**', '.expo/**']
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'max-lines': ["error", { "max": 350, "skipBlankLines": true, "skipComments": true }]
    },
  },
  {
    files: ['src/components/**/*.js', 'src/screens/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*', 'firebase', '**/firebase'],
              message: 'Direct Database/Firebase connections are forbidden inside visual templates (components/screens). All database CRUD queries must be handled by the services or custom hooks layer.'
            }
          ]
        }
      ]
    }
  }
];
