import { describe, test, expect } from '@jest/globals';
import { loadFixture, loadADRFixture, createMockOctokit } from './utils/testHelpers.js';
import { MockFactory } from './utils/mockFactory.js';
import { GitHubResponses } from './utils/mockFactory/githubResponses.js';
import { TEST_CONFIG, getTestEnvironment, getADRTestData } from './config/testConfig.js';

describe('Test Fixtures and Utilities', () => {
  describe('Test Configuration', () => {
    test('should provide complete test environment configuration', () => {
      const env = getTestEnvironment();
      
      expect(env.NODE_ENV).toBe('test');
      expect(env.GITHUB_USER).toBe('test-user');
      expect(env.GITHUB_REPO).toBe('test-repo');
      expect(env.GITHUB_PATH_TO_ADRS).toBe('docs/decisions');
    });

    test('should provide ADR test data configurations', () => {
      const minimalData = getADRTestData('minimal');
      const completeData = getADRTestData('complete');
      
      expect(minimalData.status).toBe('open');
      expect(completeData.impact).toBe('high');
      expect(completeData.tags).toContain('architecture');
    });
  });

  describe('ADR Fixture Files', () => {
    test('should load open status ADR fixture', async () => {
      const { content, ast } = await loadADRFixture('0001-test-adr-open.md');
      
      expect(content).toContain('impact: high');
      expect(content).toContain('status: open');
      expect(content).toContain('API Design Pattern');
      expect(ast).toBeDefined();
      expect(ast.children).toBeDefined();
    });

    test('should load committed status ADR fixture', async () => {
      const { content, ast } = await loadADRFixture('0002-test-adr-committed.md');
      
      expect(content).toContain('status: committed');
      expect(content).toContain('Container Orchestration Platform');
    });

    test('should load deferred status ADR fixture', async () => {
      const { content, ast } = await loadADRFixture('0003-test-adr-deferred.md');
      
      expect(content).toContain('status: deferred');
      expect(content).toContain('Real-time Performance Monitoring');
    });

    test('should load obsolete status ADR fixture', async () => {
      const { content, ast } = await loadADRFixture('0004-test-adr-obsolete.md');
      
      expect(content).toContain('status: obsolete');
      expect(content).toContain('Database Migration Strategy');
    });

    test('should load minimal ADR fixture', async () => {
      const { content, ast } = await loadADRFixture('0005-test-adr-minimal.md');
      
      expect(content).toContain('status: open');
      expect(content).toContain('Minimal ADR Example');
      expect(content).not.toContain('impact:');
    });
  });

  describe('Mock Factory', () => {
    test('should create ADR files GraphQL response', () => {
      const response = MockFactory.createADRFilesResponse();
      
      expect(response.repository.object.entries).toBeDefined();
      expect(response.repository.object.entries.length).toBeGreaterThan(0);
      
      const firstEntry = response.repository.object.entries[0];
      expect(firstEntry.name).toMatch(/^\d{4}-.*\.md$/);
      expect(firstEntry.object.text).toContain('---');
    });

    test('should create custom ADR content', () => {
      const content = MockFactory.createADRContent('Test Decision', 'committed', {
        impact: 'high',
        tags: ['test', 'mock']
      });
      
      expect(content).toContain('status: committed');
      expect(content).toContain('impact: high');
      expect(content).toContain('# Test Decision');
      expect(content).toContain('- test');
      expect(content).toContain('- mock');
    });

    test('should create GitHub branch response', () => {
      const response = GitHubResponses.createBranchResponse('feature/test');

      expect(response.ref).toBe('refs/heads/feature/test');
      expect(response.object.sha).toBeDefined();
      expect(response.url).toContain('test-user/test-repo');
    });

    test('should create GitHub file response', () => {
      const response = GitHubResponses.createFileResponse('test.md');

      expect(response.content.name).toBe('test.md');
      expect(response.content.path).toContain('docs/decisions/test.md');
      expect(response.commit.sha).toBeDefined();
    });

    test('should create pull request response', () => {
      const response = GitHubResponses.createPullRequestResponse(123, 'Test PR');

      expect(response.number).toBe(123);
      expect(response.title).toBe('Test PR');
      expect(response.html_url).toContain('/pull/123');
    });

    test('should create Slack command payload', () => {
      const command = MockFactory.createSlackCommand('log --status open');
      
      expect(command.command).toBe('/adr');
      expect(command.text).toBe('log --status open');
      expect(command.team_id).toBe(TEST_CONFIG.slack.teamId);
    });
  });

  describe('Mock Octokit', () => {
    test('should create mock Octokit with default responses', () => {
      const mockOctokit = createMockOctokit();
      
      expect(mockOctokit.graphql).toBeDefined();
      expect(mockOctokit.rest.git.createRef).toBeDefined();
      expect(mockOctokit.rest.repos.createOrUpdateFileContents).toBeDefined();
      expect(mockOctokit.rest.pulls.create).toBeDefined();
    });

    test('should create mock Octokit with custom responses', () => {
      const customResponse = { test: 'data' };
      const mockOctokit = createMockOctokit({
        graphql: customResponse
      });
      
      expect(mockOctokit.graphql).toBeDefined();
    });
  });
});