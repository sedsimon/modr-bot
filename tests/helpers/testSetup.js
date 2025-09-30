import { jest } from '@jest/globals';

/**
 * Common test setup and teardown utilities
 * Provides reusable helpers for managing test state and environment
 */

/**
 * Save and restore environment variables
 * @returns {Object} Object with save() and restore() methods
 */
export function environmentManager() {
  let savedEnv = null;

  return {
    /**
     * Save current environment state
     */
    save() {
      savedEnv = { ...process.env };
    },

    /**
     * Restore environment to saved state
     */
    restore() {
      if (!savedEnv) {
        throw new Error('No saved environment to restore. Call save() first.');
      }

      // Remove keys that weren't in saved env
      Object.keys(process.env).forEach(key => {
        if (!(key in savedEnv)) {
          delete process.env[key];
        }
      });

      // Restore saved values
      Object.keys(savedEnv).forEach(key => {
        process.env[key] = savedEnv[key];
      });
    },

    /**
     * Reset to null for cleanup
     */
    clear() {
      savedEnv = null;
    }
  };
}

/**
 * Create a mock reset manager for tracking and resetting mocks
 * @returns {Object} Object with register() and resetAll() methods
 */
export function mockManager() {
  const mocks = [];

  return {
    /**
     * Register a mock to be reset later
     * @param {Object} mock - Jest mock to register
     * @returns {Object} The mock (for chaining)
     */
    register(mock) {
      mocks.push(mock);
      return mock;
    },

    /**
     * Reset all registered mocks
     */
    resetAll() {
      mocks.forEach(mock => {
        if (mock.mockReset) {
          mock.mockReset();
        } else if (mock.mockClear) {
          mock.mockClear();
        }
      });
    },

    /**
     * Clear all registered mocks
     */
    clearAll() {
      mocks.forEach(mock => {
        if (mock.mockClear) {
          mock.mockClear();
        }
      });
    },

    /**
     * Get count of registered mocks
     * @returns {number} Number of registered mocks
     */
    count() {
      return mocks.length;
    }
  };
}

/**
 * Setup test environment with common variables
 * @param {Object} overrides - Environment variable overrides
 * @returns {Object} Environment manager instance
 */
export function setupTestEnv(overrides = {}) {
  const envManager = environmentManager();
  envManager.save();

  const defaultEnv = {
    GITHUB_TOKEN: 'test-token',
    GITHUB_USER: 'testuser',
    GITHUB_REPO: 'testrepo',
    GITHUB_DEFAULT_BRANCH: 'main',
    GITHUB_PATH_TO_ADRS: 'docs/decisions',
    GITHUB_ADR_REGEX: '\\d{4}-.*\\.md$',
    ADR_PARSER: './adrParser.js',
    ...overrides
  };

  Object.keys(defaultEnv).forEach(key => {
    process.env[key] = defaultEnv[key];
  });

  return envManager;
}

/**
 * Create a test context object that bundles common test utilities
 * @returns {Object} Test context with env and mock managers
 */
export function createTestContext() {
  const envManager = environmentManager();
  const mockMgr = mockManager();

  return {
    env: envManager,
    mocks: mockMgr,

    /**
     * Setup test environment
     * @param {Object} overrides - Environment variable overrides
     */
    setup(overrides = {}) {
      envManager.save();
      const defaultEnv = {
        GITHUB_TOKEN: 'test-token',
        GITHUB_USER: 'testuser',
        GITHUB_REPO: 'testrepo',
        GITHUB_DEFAULT_BRANCH: 'main',
        GITHUB_PATH_TO_ADRS: 'docs/decisions',
        GITHUB_ADR_REGEX: '\\d{4}-.*\\.md$',
        ADR_PARSER: './adrParser.js',
        ...overrides
      };

      Object.keys(defaultEnv).forEach(key => {
        process.env[key] = defaultEnv[key];
      });
    },

    /**
     * Cleanup all test state
     */
    cleanup() {
      mockMgr.resetAll();
      envManager.restore();
      jest.resetModules();
    }
  };
}

/**
 * Assertion helpers for common test patterns
 */
export const assertions = {
  /**
   * Assert that an ADR object has the expected structure
   * @param {Object} adr - ADR object to validate
   */
  expectValidAdrStructure(adr) {
    expect(adr).toBeDefined();
    expect(adr).toHaveProperty('name');
    expect(adr).toHaveProperty('githubUrl');
    expect(adr).toHaveProperty('data');
    expect(typeof adr.name).toBe('string');
    expect(typeof adr.githubUrl).toBe('string');
    expect(typeof adr.data).toBe('object');
  },

  /**
   * Assert that an ADR has required frontmatter fields
   * @param {Object} adr - ADR object to validate
   */
  expectValidAdrFrontmatter(adr) {
    expect(adr.data).toHaveProperty('frontmatter');
    const fm = adr.data.frontmatter;
    expect(fm).toHaveProperty('status');
    expect(fm).toHaveProperty('impact');
    expect(fm).toHaveProperty('reversibility');
  },

  /**
   * Assert that a GitHub URL has the correct format
   * @param {string} url - URL to validate
   * @param {Object} options - Expected URL components
   */
  expectValidGitHubUrl(url, options = {}) {
    const {
      owner = 'testuser',
      repo = 'testrepo',
      branch = 'main',
      path = 'docs/decisions'
    } = options;

    expect(url).toMatch(/^https:\/\/github\.com/);
    expect(url).toContain(`/${owner}/${repo}/blob/${branch}/${path}/`);
    expect(url).toMatch(/\.md$/);
  },

  /**
   * Assert that an array contains ADRs with specific statuses
   * @param {Array} adrs - Array of ADR objects
   * @param {Array} expectedStatuses - Expected status values
   */
  expectAdrStatuses(adrs, expectedStatuses) {
    const actualStatuses = adrs.map(adr => adr.data?.frontmatter?.status);
    expectedStatuses.forEach(status => {
      expect(actualStatuses).toContain(status);
    });
  },

  /**
   * Assert that an array contains ADRs with specific tags
   * @param {Array} adrs - Array of ADR objects
   * @param {Array} expectedTags - Expected tag values
   */
  expectAdrTags(adrs, expectedTags) {
    const allTags = adrs.flatMap(adr => adr.data?.frontmatter?.tags || []);
    expectedTags.forEach(tag => {
      expect(allTags).toContain(tag);
    });
  },

  /**
   * Assert that a mock was called with specific GraphQL query
   * @param {Object} mock - Jest mock function
   * @param {Object} expectedVars - Expected GraphQL variables
   */
  expectGraphQLCall(mock, expectedVars) {
    expect(mock).toHaveBeenCalled();
    const calls = mock.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toContain('query');
    expect(lastCall[1]).toMatchObject(expectedVars);
  },

  /**
   * Assert that an error has expected properties
   * @param {Error} error - Error object
   * @param {Object} expected - Expected error properties
   */
  expectError(error, expected = {}) {
    expect(error).toBeInstanceOf(Error);
    if (expected.message) {
      expect(error.message).toMatch(expected.message);
    }
    if (expected.code) {
      expect(error.code).toBe(expected.code);
    }
  }
};

/**
 * Setup/teardown helpers for describe blocks
 */
export const describeHelpers = {
  /**
   * Create beforeEach handler with test context
   * @param {Function} setupFn - Optional additional setup function
   * @returns {Function} beforeEach handler
   */
  beforeEach(setupFn) {
    return async function() {
      const context = createTestContext();
      context.setup();

      if (setupFn) {
        await setupFn.call(this, context);
      }

      // Make context available to tests
      this.testContext = context;
    };
  },

  /**
   * Create afterEach handler with test context
   * @param {Function} cleanupFn - Optional additional cleanup function
   * @returns {Function} afterEach handler
   */
  afterEach(cleanupFn) {
    return async function() {
      if (cleanupFn) {
        await cleanupFn.call(this, this.testContext);
      }

      if (this.testContext) {
        this.testContext.cleanup();
      }
    };
  }
};