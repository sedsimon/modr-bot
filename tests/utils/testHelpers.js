import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a fixture file from the tests/fixtures directory
 * @param {string} fixturePath - Path relative to tests/fixtures
 * @returns {Promise<string>} File contents
 */
export async function loadFixture(fixturePath) {
  const fullPath = join(__dirname, '..', 'fixtures', fixturePath);
  return await readFile(fullPath, 'utf-8');
}

/**
 * Parse an ADR markdown file into an AST
 * @param {string} markdownContent - The markdown content to parse
 * @returns {Promise<Object>} The AST representation
 */
export async function parseADRMarkdown(markdownContent) {
  return await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(markdownContent);
}

/**
 * Load and parse an ADR fixture file
 * @param {string} adrFileName - Name of the ADR file in tests/fixtures/adrs
 * @returns {Promise<{content: string, ast: Object}>}
 */
export async function loadADRFixture(adrFileName) {
  const content = await loadFixture(`adrs/${adrFileName}`);
  const ast = await parseADRMarkdown(content);
  return { content, ast };
}

/**
 * Create a mock Octokit instance with predefined responses
 * @param {Object} mockResponses - Object containing mock responses for different methods
 * @returns {Object} Mock Octokit instance
 */
export function createMockOctokit(mockResponses = {}) {
  return {
    graphql: jest.fn().mockImplementation((query, variables) => {
      if (mockResponses.graphql) {
        return Promise.resolve(mockResponses.graphql);
      }
      return Promise.reject(new Error('No mock response defined for GraphQL query'));
    }),
    rest: {
      git: {
        createRef: jest.fn().mockImplementation(() => {
          if (mockResponses.createRef) {
            return Promise.resolve({ data: mockResponses.createRef });
          }
          return Promise.reject(new Error('No mock response defined for createRef'));
        }),
        getRef: jest.fn().mockImplementation(() => {
          if (mockResponses.getRef) {
            return Promise.resolve({ data: mockResponses.getRef });
          }
          return Promise.reject(new Error('No mock response defined for getRef'));
        })
      },
      repos: {
        createOrUpdateFileContents: jest.fn().mockImplementation(() => {
          if (mockResponses.createOrUpdateFileContents) {
            return Promise.resolve({ data: mockResponses.createOrUpdateFileContents });
          }
          return Promise.reject(new Error('No mock response defined for createOrUpdateFileContents'));
        })
      },
      pulls: {
        create: jest.fn().mockImplementation(() => {
          if (mockResponses.createPullRequest) {
            return Promise.resolve({ data: mockResponses.createPullRequest });
          }
          return Promise.reject(new Error('No mock response defined for createPullRequest'));
        })
      }
    }
  };
}

/**
 * Set up test environment variables for ADR testing
 * @param {Object} overrides - Environment variable overrides
 */
export function setupTestEnvironment(overrides = {}) {
  const defaultEnv = {
    NODE_ENV: 'test',
    GITHUB_TOKEN: 'test-token',
    GITHUB_USER: 'test-user',
    GITHUB_REPO: 'test-repo',
    GITHUB_DEFAULT_BRANCH: 'main',
    GITHUB_PATH_TO_ADRS: 'docs/decisions',
    GITHUB_ADR_REGEX: '\\d{4}-.*\\.md',
    GITHUB_ADR_TEMPLATE: 'docs/decisions/decision-template.md',
    ADR_PARSER: './adrParser.js',
    ADR_TO_BLOCK_TRANSFORMER: './blockFormatter.js'
  };

  const testEnv = { ...defaultEnv, ...overrides };
  
  Object.keys(testEnv).forEach(key => {
    process.env[key] = testEnv[key];
  });

  return testEnv;
}

/**
 * Clean up test environment by restoring original values
 * @param {Object} originalEnv - Original environment values to restore
 */
export function cleanupTestEnvironment(originalEnv = {}) {
  Object.keys(originalEnv).forEach(key => {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  });
}

/**
 * Create a test ADR data structure
 * @param {Object} overrides - Properties to override in the test data
 * @returns {Object} Test ADR data
 */
export function createTestADRData(overrides = {}) {
  const defaultData = {
    name: '0001-test-decision.md',
    githubUrl: 'https://github.com/test-user/test-repo/blob/main/docs/decisions/0001-test-decision.md',
    data: {
      frontmatter: {
        impact: 'medium',
        reversibility: 'low',
        status: 'open',
        tags: ['test', 'architecture'],
        'review-by': '2024-01-15',
        'decide-by': '2024-02-01'
      },
      title: 'Test Decision',
      'Problem Description': 'This is a test problem description.',
      'Accepted Solution': 'This is a test solution.'
    }
  };

  return { ...defaultData, ...overrides };
}

/**
 * Create mock Slack command payload for testing
 * @param {Object} overrides - Properties to override in the command payload
 * @returns {Object} Mock Slack command payload
 */
export function createMockSlackCommand(overrides = {}) {
  const defaultCommand = {
    token: 'test-token',
    team_id: 'T1234567890',
    team_domain: 'test-team',
    channel_id: 'C1234567890',
    channel_name: 'general',
    user_id: 'U1234567890',
    user_name: 'testuser',
    command: '/adr',
    text: 'log',
    response_url: 'https://hooks.slack.com/commands/1234567890/test',
    trigger_id: '1234567890.1234567890.test'
  };

  return { ...defaultCommand, ...overrides };
}

/**
 * Wait for a specified amount of time (useful for testing async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}