// Test setup file for Jest
// This file runs before all tests

import { getTestEnvironment } from './config/testConfig.js';
import { jest } from '@jest/globals';

// Set up test environment variables
const testEnv = getTestEnvironment();
Object.keys(testEnv).forEach(key => {
  process.env[key] = testEnv[key];
});

// Global test utilities
global.testUtils = {
  // Store original environment for cleanup
  originalEnv: { ...process.env }
};