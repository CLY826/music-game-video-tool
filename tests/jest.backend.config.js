/** @type {import('jest').Config} */
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  displayName: 'backend',
  testEnvironment: 'node',
  rootDir: projectRoot,
  testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '<rootDir>/cloudfunctions/**/index.js'
  ],
  coverageProvider: 'v8',
  moduleNameMapper: {
    'wx-server-sdk': '<rootDir>/tests/backend/__mocks__/wx-server-sdk.js'
  },
  verbose: true
};
