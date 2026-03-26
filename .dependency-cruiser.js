/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {},
      to: { orphan: true },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'dist', 'tests', 'reports', '.planning'],
    },
    tsConfig: {
      fileName: './tsconfig.json',
    },
    enhancedResolveOptions: {
      extensions: ['.ts'],
    },
  },
};
