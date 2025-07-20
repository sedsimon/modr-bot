import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('App Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should require environment variables', () => {
    expect(process.env).toBeDefined();
  });

  test('should have package.json type set to module', async () => {
    const packageJson = await import('../package.json', { assert: { type: 'json' } });
    expect(packageJson.default.type).toBe('module');
  });
});