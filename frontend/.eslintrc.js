module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off',
    'no-console': 'warn',
  },
};