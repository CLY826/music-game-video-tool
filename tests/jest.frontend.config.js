/** @type {import('jest').Config} */
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  displayName: 'frontend',
  testEnvironment: 'node',
  rootDir: projectRoot,
  testMatch: ['<rootDir>/tests/frontend/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '<rootDir>/pages/upload/upload.js',
    '<rootDir>/pages/index/index.js'
  ],
  coverageProvider: 'v8',
  setupFiles: ['<rootDir>/tests/frontend/__mocks__/wx-globals.js'],
  verbose: true
};
