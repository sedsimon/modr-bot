import { describe, test, expect } from '@jest/globals';
import { GitHubResponses } from './githubResponses.js';
import { TEST_CONFIG } from '../../config/testConfig.js';

describe('GitHubResponses', () => {
  describe('Branch Responses', () => {
    test('should create branch response with defaults', () => {
      const response = GitHubResponses.createBranchResponse();

      expect(response.ref).toBe('refs/heads/feature/test-branch');
      expect(response.object.sha).toBe(TEST_CONFIG.github.testShas.featureBranch);
      expect(response.url).toContain('test-user/test-repo');
    });

    test('should create branch response with custom values', () => {
      const response = GitHubResponses.createBranchResponse('custom/branch', 'abc123');

      expect(response.ref).toBe('refs/heads/custom/branch');
      expect(response.object.sha).toBe('abc123');
      expect(response.url).toContain('custom/branch');
    });
  });

  describe('File Responses', () => {
    test('should create file response with defaults', () => {
      const response = GitHubResponses.createFileResponse();

      expect(response.content.name).toBe('test-file.md');
      expect(response.content.path).toBe('docs/decisions/test-file.md');
      expect(response.commit.sha).toBeDefined();
    });

    test('should create file response with custom values', () => {
      const response = GitHubResponses.createFileResponse('custom.md', 'custom/path/custom.md');

      expect(response.content.name).toBe('custom.md');
      expect(response.content.path).toBe('custom/path/custom.md');
    });
  });

  describe('Pull Request Responses', () => {
    test('should create PR response with defaults', () => {
      const response = GitHubResponses.createPullRequestResponse();

      expect(response.number).toBe(42);
      expect(response.title).toBe('Add new ADR');
      expect(response.state).toBe('open');
    });

    test('should create PR response with custom values', () => {
      const response = GitHubResponses.createPullRequestResponse(123, 'Custom PR', 'custom/branch');

      expect(response.number).toBe(123);
      expect(response.title).toBe('Custom PR');
      expect(response.head.ref).toBe('custom/branch');
    });
  });

  describe('Error Responses', () => {
    test('should create GraphQL error response', () => {
      const response = GitHubResponses.createGraphQLErrorResponse('TEST_ERROR', 'Test error message', ['test', 'path']);

      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].type).toBe('TEST_ERROR');
      expect(response.errors[0].message).toBe('Test error message');
      expect(response.errors[0].path).toEqual(['test', 'path']);
    });

    test('should create repository not found error', () => {
      const response = GitHubResponses.createRepositoryNotFoundError('missing-repo');

      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].type).toBe('NOT_FOUND');
      expect(response.errors[0].message).toContain('missing-repo');
    });

    test('should create authentication error', () => {
      const response = GitHubResponses.createAuthenticationError();

      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].type).toBe('FORBIDDEN');
    });

    test('should create rate limit error', () => {
      const response = GitHubResponses.createRateLimitError();

      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].type).toBe('RATE_LIMITED');
    });

    test('should create network timeout error', () => {
      const error = GitHubResponses.createNetworkTimeoutError();

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('ETIMEDOUT');
      expect(error.message).toBe('Request timeout');
    });
  });

  describe('Empty/Null/Missing Responses', () => {
    test('should create empty repository response', () => {
      const response = GitHubResponses.createEmptyRepositoryResponse();

      expect(response.repository.object.entries).toEqual([]);
    });

    test('should create null object response', () => {
      const response = GitHubResponses.createNullObjectResponse();

      expect(response.repository.object).toBeNull();
    });

    test('should create missing entries response', () => {
      const response = GitHubResponses.createMissingEntriesResponse();

      expect(response.repository.object).toBeDefined();
      expect(response.repository.object.entries).toBeUndefined();
    });

    test('should create malformed ADR response', () => {
      const response = GitHubResponses.createMalformedADRResponse(3);

      expect(response.repository.object.entries).toHaveLength(3);
      expect(response.repository.object.entries[0].name).toContain('malformed-adr');
      expect(response.repository.object.entries[0].object.text).toBeUndefined();
    });

    test('should create null content ADRs', () => {
      const response = GitHubResponses.createNullContentADRs(2);

      expect(response.repository.object.entries).toHaveLength(2);
      expect(response.repository.object.entries[0].object.text).toBeNull();
    });
  });

  describe('Mock Octokit', () => {
    test('should create mock Octokit with default responses', () => {
      const mockCreateADRFilesResponse = () => ({ test: 'data' });
      const octokit = GitHubResponses.createMockOctokit({}, mockCreateADRFilesResponse);

      expect(octokit.graphql).toBeDefined();
      expect(octokit.rest.git.createRef).toBeDefined();
      expect(octokit.rest.repos.createOrUpdateFileContents).toBeDefined();
      expect(octokit.rest.pulls.create).toBeDefined();
    });

    test('should create mock Octokit with custom responses', async () => {
      const customResponse = { custom: 'data' };
      const mockCreateADRFilesResponse = () => ({ test: 'data' });
      const octokit = GitHubResponses.createMockOctokit(
        { graphql: customResponse },
        mockCreateADRFilesResponse
      );

      const result = await octokit.graphql();
      expect(result).toEqual(customResponse);
    });

    test('should create mock Octokit with errors', () => {
      const mockCreateADRFilesResponse = () => ({ test: 'data' });
      const octokit = GitHubResponses.createMockOctokitWithErrors(
        { networkError: { failCount: 1 } },
        {},
        mockCreateADRFilesResponse
      );

      expect(octokit.graphql).toBeDefined();
      expect(typeof octokit.graphql).toBe('function');
    });
  });

  describe('Large Dataset Responses', () => {
    test('should create large dataset response', () => {
      const mockCreateADRContent = (title, status, options) => `Mock content for ${title}`;
      const response = GitHubResponses.createLargeDatasetResponse(10, mockCreateADRContent);

      expect(response.repository.object.entries).toHaveLength(10);
      expect(response.repository.object.entries[0].name).toContain('large-dataset-adr');
    });

    test('should create memory stress test data', () => {
      const response = GitHubResponses.createMemoryStressTestData(5, 10);

      expect(response.repository.object.entries).toHaveLength(5);
      expect(response.repository.object.entries[0].object.text.length).toBeGreaterThan(10000);
    });

    test('should create async processing test data', () => {
      const mockCreateADRContent = (title, status, options) => `Mock content for ${title}`;
      const response = GitHubResponses.createAsyncProcessingTestData(15, mockCreateADRContent);

      expect(response.repository.object.entries).toHaveLength(15);
      expect(response.repository.object.entries[0].name).toContain('async-test');
    });
  });

  describe('Corrupted/Partial Responses', () => {
    test('should create corrupted JSON response', () => {
      const response = GitHubResponses.createCorruptedJSONResponse();

      expect(response.repository.object.entries).toHaveLength(2);
      // First entry missing object field
      expect(response.repository.object.entries[0].name).toBeDefined();
      expect(response.repository.object.entries[0].object).toBeUndefined();
      // Second entry missing name field
      expect(response.repository.object.entries[1].name).toBeUndefined();
      expect(response.repository.object.entries[1].object).toBeDefined();
    });

    test('should create partial data response', () => {
      const response = GitHubResponses.createPartialDataResponse();

      expect(response.repository.name).toBe('test-repo');
      expect(response.repository.object).toBeUndefined();
    });
  });
});
