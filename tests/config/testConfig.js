/**
 * Test configuration for consistent testing across all test suites
 * This module provides centralized configuration for test environments,
 * mock data, and test utilities.
 */

export const TEST_CONFIG = {
  // Environment variables for testing
  env: {
    NODE_ENV: 'test',
    SLACK_BOT_TOKEN: 'xoxb-test-bot-token',
    SLACK_SIGNING_SECRET: 'test-signing-secret',
    SLACK_APP_TOKEN: 'xapp-test-app-token',
    GITHUB_TOKEN: 'ghp_test-github-token',
    GITHUB_USER: 'test-user',
    GITHUB_REPO: 'test-repo',
    GITHUB_DEFAULT_BRANCH: 'main',
    GITHUB_PATH_TO_ADRS: 'docs/decisions',
    GITHUB_ADR_REGEX: '\\d{4}-.*\\.md',
    GITHUB_ADR_TEMPLATE: 'docs/decisions/decision-template.md',
    ADR_PARSER: './adrParser.js',
    ADR_TO_BLOCK_FORMATTER: './blockFormatter.js'
  },

  // ADR test data patterns
  adr: {
    // Valid ADR frontmatter combinations
    frontmatter: {
      minimal: {
        status: 'open'
      },
      complete: {
        impact: 'high',
        reversibility: 'medium',
        status: 'open',
        tags: ['architecture', 'api'],
        'review-by': '2024-01-15',
        'decide-by': '2024-02-01'
      },
      committed: {
        impact: 'medium',
        reversibility: 'low',
        status: 'committed',
        tags: ['infrastructure'],
        'decide-by': '2023-12-01'
      },
      deferred: {
        impact: 'low',
        reversibility: 'high',
        status: 'deferred',
        tags: ['performance'],
        'review-by': '2024-06-01'
      },
      obsolete: {
        impact: 'medium',
        reversibility: 'medium',
        status: 'obsolete',
        tags: ['legacy']
      }
    },

    // ADR status values for testing filters
    statuses: ['open', 'committed', 'deferred', 'obsolete'],
    
    // Impact levels for testing
    impactLevels: ['low', 'medium', 'high'],
    
    // Reversibility levels for testing
    reversibilityLevels: ['low', 'medium', 'high'],

    // Common tag combinations for testing
    tagCombinations: [
      ['architecture'],
      ['infrastructure', 'deployment'],
      ['performance', 'monitoring'],
      ['security', 'compliance'],
      ['api', 'integration'],
      ['legacy', 'migration']
    ]
  },

  // GitHub API mock responses
  github: {
    // Default repository structure
    defaultRepo: {
      owner: 'test-user',
      repo: 'test-repo',
      defaultBranch: 'main'
    },

    // Common SHA values for testing
    testShas: {
      mainBranch: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
      featureBranch: '7638417db6d59f3c431d3e1f261cc637155684cd',
      fileContent: '95b966ae1c166bd92f8ae7d1c313e738c731dfc3'
    }
  },

  // Slack API mock data
  slack: {
    // Default team and channel IDs for testing
    teamId: 'T1234567890',
    channelId: 'C1234567890',
    userId: 'U1234567890',
    
    // Command text variations for testing
    commands: {
      log: {
        basic: 'log',
        withStatus: 'log --status open',
        withTags: 'log --tags architecture',
        withMultipleFilters: 'log --status open --tags architecture,api'
      },
      add: {
        basic: 'add "Test Decision" --impact high',
        withAllOptions: 'add "Test Decision" --impact high --reversibility medium --tags architecture,api --review-by 2024-01-15 --decide-by 2024-02-01'
      }
    }
  },

  // Test timeouts and delays
  timeouts: {
    short: 1000,    // 1 second
    medium: 5000,   // 5 seconds
    long: 10000     // 10 seconds
  },

  // Test file names and patterns
  files: {
    adrPattern: /^\d{4}-.*\.md$/,
    testAdrFiles: [
      '0001-test-adr-open.md',
      '0002-test-adr-committed.md',
      '0003-test-adr-deferred.md',
      '0004-test-adr-obsolete.md',
      '0005-test-adr-minimal.md'
    ],
    invalidFiles: [
      'invalid-no-frontmatter.md',
      'not-an-adr.txt',
      'README.md'
    ]
  }
};

/**
 * Get test environment configuration with optional overrides
 * @param {Object} overrides - Environment variable overrides
 * @returns {Object} Complete environment configuration
 */
export function getTestEnvironment(overrides = {}) {
  return { ...TEST_CONFIG.env, ...overrides };
}

/**
 * Get ADR test data by type
 * @param {string} type - Type of ADR data (minimal, complete, committed, etc.)
 * @returns {Object} ADR frontmatter data
 */
export function getADRTestData(type = 'complete') {
  return TEST_CONFIG.adr.frontmatter[type] || TEST_CONFIG.adr.frontmatter.complete;
}

/**
 * Get GitHub mock data configuration
 * @returns {Object} GitHub test configuration
 */
export function getGitHubTestConfig() {
  return TEST_CONFIG.github;
}

/**
 * Get Slack mock data configuration
 * @returns {Object} Slack test configuration
 */
export function getSlackTestConfig() {
  return TEST_CONFIG.slack;
}