import { TEST_CONFIG } from '../../config/testConfig.js';
import { jest } from '@jest/globals';

/**
 * Factory for creating GitHub-specific mock responses
 * This module contains all GitHub API mock response generators
 */
export class GitHubResponses {

  /**
   * Create a mock GitHub branch response
   * @param {string} branchName - Name of the branch
   * @param {string} sha - SHA of the branch head
   * @returns {Object} Mock branch response
   */
  static createBranchResponse(branchName = 'feature/test-branch', sha = TEST_CONFIG.github.testShas.featureBranch) {
    return {
      ref: `refs/heads/${branchName}`,
      node_id: 'test-node-id',
      url: `https://api.github.com/repos/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/git/refs/heads/${branchName}`,
      object: {
        sha,
        type: 'commit',
        url: `https://api.github.com/repos/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/git/commits/${sha}`
      }
    };
  }

  /**
   * Create a mock GitHub file creation response
   * @param {string} fileName - Name of the created file
   * @param {string} filePath - Path of the created file
   * @returns {Object} Mock file creation response
   */
  static createFileResponse(fileName = 'test-file.md', filePath = `docs/decisions/${fileName}`) {
    return {
      content: {
        name: fileName,
        path: filePath,
        sha: TEST_CONFIG.github.testShas.fileContent,
        size: 362,
        url: `https://api.github.com/repos/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/contents/${filePath}`,
        html_url: `https://github.com/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/blob/main/${filePath}`,
        download_url: `https://raw.githubusercontent.com/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/main/${filePath}`,
        type: 'file'
      },
      commit: {
        sha: TEST_CONFIG.github.testShas.featureBranch,
        node_id: 'test-commit-node-id',
        url: `https://api.github.com/repos/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/git/commits/${TEST_CONFIG.github.testShas.featureBranch}`
      }
    };
  }

  /**
   * Create a mock GitHub Pull Request response
   * @param {number} prNumber - PR number
   * @param {string} title - PR title
   * @param {string} branchName - Source branch name
   * @returns {Object} Mock PR response
   */
  static createPullRequestResponse(prNumber = 42, title = 'Add new ADR', branchName = 'feature/test-branch') {
    return {
      id: prNumber,
      number: prNumber,
      html_url: `https://github.com/${TEST_CONFIG.github.defaultRepo.owner}/${TEST_CONFIG.github.defaultRepo.repo}/pull/${prNumber}`,
      title,
      body: `This PR adds a new Architectural Decision Record: ${title}`,
      state: 'open',
      head: {
        ref: branchName,
        sha: TEST_CONFIG.github.testShas.featureBranch
      },
      base: {
        ref: TEST_CONFIG.github.defaultRepo.defaultBranch,
        sha: TEST_CONFIG.github.testShas.mainBranch
      }
    };
  }

  // ====================================================================
  // ERROR RESPONSE METHODS FOR COMPREHENSIVE getAdrFiles() ERROR TESTING
  // ====================================================================

  /**
   * Create a standard GraphQL error response structure
   * @param {string} errorType - Type of GraphQL error (e.g., 'NOT_FOUND', 'FORBIDDEN')
   * @param {string} message - Error message
   * @param {Array} path - GraphQL path where error occurred
   * @returns {Object} GraphQL error response structure
   */
  static createGraphQLErrorResponse(errorType, message, path = []) {
    return {
      errors: [
        {
          message,
          type: errorType,
          path,
          locations: [{ line: 1, column: 1 }]
        }
      ]
    };
  }

  /**
   * Create repository not found error response
   * @param {string} repoName - Repository name that was not found
   * @returns {Object} GraphQL error response for repository not found
   */
  static createRepositoryNotFoundError(repoName = 'test-repo') {
    return this.createGraphQLErrorResponse(
      'NOT_FOUND',
      `Could not resolve to a Repository with the name '${repoName}'.`,
      ['repository']
    );
  }

  /**
   * Create authentication error response
   * @returns {Object} GraphQL error response for authentication failure
   */
  static createAuthenticationError() {
    return this.createGraphQLErrorResponse(
      'FORBIDDEN',
      'Resource not accessible by personal access token',
      ['repository']
    );
  }

  /**
   * Create rate limit error response
   * @param {number} resetTime - Unix timestamp when rate limit resets
   * @returns {Object} GraphQL error response for rate limiting
   */
  static createRateLimitError(resetTime = Date.now() + 3600000) {
    return this.createGraphQLErrorResponse(
      'RATE_LIMITED',
      `API rate limit exceeded. Rate limit will reset at ${new Date(resetTime).toISOString()}.`,
      []
    );
  }

  /**
   * Create network timeout error response
   * @returns {Object} Network timeout error (thrown as exception, not GraphQL response)
   */
  static createNetworkTimeoutError() {
    const error = new Error('Request timeout');
    error.code = 'ETIMEDOUT';
    error.errno = -110;
    error.syscall = 'connect';
    return error;
  }

  /**
   * Create empty repository response (no ADR files)
   * @returns {Object} GraphQL response with empty entries array
   */
  static createEmptyRepositoryResponse() {
    return {
      repository: {
        object: {
          entries: []
        }
      }
    };
  }

  /**
   * Create response with missing object field (null object)
   * @returns {Object} GraphQL response with null object field
   */
  static createNullObjectResponse() {
    return {
      repository: {
        object: null
      }
    };
  }

  /**
   * Create response without entries field
   * @returns {Object} GraphQL response missing entries field
   */
  static createMissingEntriesResponse() {
    return {
      repository: {
        object: {
          // Missing entries field entirely
        }
      }
    };
  }

  /**
   * Create ADR files with missing text field
   * @param {number} count - Number of malformed ADRs to create
   * @returns {Object} GraphQL response with ADRs missing text field
   */
  static createMalformedADRResponse(count = 2) {
    const entries = [];

    for (let i = 0; i < count; i++) {
      entries.push({
        name: `${String(i + 1).padStart(4, '0')}-malformed-adr-${i + 1}.md`,
        object: {
          // Missing text field
        }
      });
    }

    return {
      repository: {
        object: {
          entries
        }
      }
    };
  }

  /**
   * Create ADR files with null content
   * @param {number} count - Number of null content ADRs to create
   * @returns {Object} GraphQL response with ADRs having null text
   */
  static createNullContentADRs(count = 2) {
    const entries = [];

    for (let i = 0; i < count; i++) {
      entries.push({
        name: `${String(i + 1).padStart(4, '0')}-null-content-adr-${i + 1}.md`,
        object: {
          text: null
        }
      });
    }

    return {
      repository: {
        object: {
          entries
        }
      }
    };
  }

  /**
   * Create corrupted JSON response structure
   * @returns {Object} Malformed GraphQL response structure
   */
  static createCorruptedJSONResponse() {
    return {
      repository: {
        object: {
          entries: [
            {
              name: '0001-corrupted-structure.md',
              // Missing object field
            },
            {
              // Missing name field
              object: {
                text: 'Some content'
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create partial data response (incomplete structure)
   * @returns {Object} GraphQL response with incomplete data structure
   */
  static createPartialDataResponse() {
    return {
      repository: {
        // Missing object field, but has other fields
        name: 'test-repo',
        description: 'Test repository'
      }
    };
  }

  /**
   * Create large dataset response for performance testing
   * @param {number} fileCount - Number of ADR files to generate
   * @param {Function} createADRContent - Function to create ADR content
   * @returns {Object} GraphQL response with large number of ADR files
   */
  static createLargeDatasetResponse(fileCount = 1000, createADRContent) {
    const entries = [];

    for (let i = 0; i < fileCount; i++) {
      const title = `Large Dataset ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-large-dataset-adr-${i + 1}.md`;

      entries.push({
        name: fileName,
        object: {
          text: createADRContent(title, 'open', {
            impact: TEST_CONFIG.adr.impactLevels[i % 3],
            tags: [`large-dataset`, `batch-${Math.floor(i / 100) + 1}`],
            'review-by': `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
            'decide-by': `2024-${String((i % 12) + 1).padStart(2, '0')}-28`
          })
        }
      });
    }

    return {
      repository: {
        object: {
          entries
        }
      }
    };
  }

  /**
   * Create memory stress test data with large file content
   * @param {number} fileCount - Number of files to create
   * @param {number} contentSizeKB - Approximate size of each file in KB
   * @returns {Object} GraphQL response with large content files
   */
  static createMemoryStressTestData(fileCount = 10, contentSizeKB = 100) {
    const entries = [];
    const largeContent = 'A'.repeat(contentSizeKB * 1024); // Create large content block

    for (let i = 0; i < fileCount; i++) {
      const title = `Memory Stress Test ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-memory-stress-${i + 1}.md`;

      // Create ADR with large content section
      const content = `---
status: open
impact: medium
reversibility: medium
tags:
  - memory-test
  - large-content
---
# ${title}

## Problem Description
This is a memory stress test ADR with large content.

## Large Content Section
${largeContent}

## Accepted Solution
Testing memory handling with large file content.

## Trade-offs
Large content may impact memory usage and processing time.`;

      entries.push({
        name: fileName,
        object: {
          text: content
        }
      });
    }

    return {
      repository: {
        object: {
          entries
        }
      }
    };
  }

  /**
   * Create test data for async processing (array.reduce) testing
   * @param {number} fileCount - Number of files to create
   * @param {Function} createADRContent - Function to create ADR content
   * @returns {Object} GraphQL response designed for async processing tests
   */
  static createAsyncProcessingTestData(fileCount = 20, createADRContent) {
    const entries = [];

    for (let i = 0; i < fileCount; i++) {
      const title = `Async Processing Test ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-async-test-${i + 1}.md`;
      const status = TEST_CONFIG.adr.statuses[i % 4];

      entries.push({
        name: fileName,
        object: {
          text: createADRContent(title, status, {
            impact: TEST_CONFIG.adr.impactLevels[i % 3],
            tags: [`async-test`, `batch-${Math.floor(i / 5) + 1}`],
            'committed-on': status === 'committed' ? '2024-01-15' : undefined,
            'decide-by': status === 'open' ? '2024-04-01' : undefined
          })
        }
      });
    }

    return {
      repository: {
        object: {
          entries
        }
      }
    };
  }

  /**
   * Create a mock Octokit instance with error injection capabilities
   * @param {Object} errorScenarios - Configuration for different error scenarios
   * @param {Object} responses - Standard responses (when not erroring)
   * @param {Function} createADRFilesResponse - Function to create ADR files response
   * @returns {Object} Mock Octokit instance with error injection
   */
  static createMockOctokitWithErrors(errorScenarios = {}, responses = {}, createADRFilesResponse) {
    const defaultResponses = {
      graphql: createADRFilesResponse(),
      createRef: this.createBranchResponse(),
      getRef: { object: { sha: TEST_CONFIG.github.testShas.mainBranch } },
      createOrUpdateFileContents: this.createFileResponse(),
      createPullRequest: this.createPullRequestResponse()
    };

    const mockResponses = { ...defaultResponses, ...responses };

    // Error injection configuration
    const {
      graphqlError = null,
      networkError = null,
      intermittentFailure = null,
      rateLimitError = null
    } = errorScenarios;

    let callCount = 0;

    // Create mock graphql function with error injection
    const mockGraphQL = jest.fn().mockImplementation(() => {
      callCount++;

      // Handle intermittent failures
      if (intermittentFailure && callCount % intermittentFailure.interval === 0) {
        if (intermittentFailure.type === 'network') {
          return Promise.reject(this.createNetworkTimeoutError());
        } else if (intermittentFailure.type === 'graphql') {
          return Promise.resolve(intermittentFailure.errorResponse);
        }
      }

      // Handle specific error types
      if (networkError && callCount <= (networkError.failCount || 1)) {
        return Promise.reject(this.createNetworkTimeoutError());
      }

      if (rateLimitError && callCount <= (rateLimitError.failCount || 1)) {
        return Promise.resolve(this.createRateLimitError());
      }

      if (graphqlError) {
        return Promise.resolve(graphqlError);
      }

      // Return successful response
      return Promise.resolve(mockResponses.graphql);
    });

    return {
      graphql: mockGraphQL,
      rest: {
        git: {
          createRef: jest.fn().mockResolvedValue({ data: mockResponses.createRef }),
          getRef: jest.fn().mockResolvedValue({ data: mockResponses.getRef })
        },
        repos: {
          createOrUpdateFileContents: jest.fn().mockResolvedValue({
            data: mockResponses.createOrUpdateFileContents
          })
        },
        pulls: {
          create: jest.fn().mockResolvedValue({ data: mockResponses.createPullRequest })
        }
      }
    };
  }

  /**
   * Create a mock Octokit instance with predefined responses
   * @param {Object} responses - Object containing mock responses for different methods
   * @param {Function} createADRFilesResponse - Function to create ADR files response
   * @returns {Object} Mock Octokit instance
   */
  static createMockOctokit(responses = {}, createADRFilesResponse) {
    const defaultResponses = {
      graphql: createADRFilesResponse(),
      createRef: this.createBranchResponse(),
      getRef: { object: { sha: TEST_CONFIG.github.testShas.mainBranch } },
      createOrUpdateFileContents: this.createFileResponse(),
      createPullRequest: this.createPullRequestResponse()
    };

    const mockResponses = { ...defaultResponses, ...responses };

    return {
      graphql: jest.fn().mockResolvedValue(mockResponses.graphql),
      rest: {
        git: {
          createRef: jest.fn().mockResolvedValue({ data: mockResponses.createRef }),
          getRef: jest.fn().mockResolvedValue({ data: mockResponses.getRef })
        },
        repos: {
          createOrUpdateFileContents: jest.fn().mockResolvedValue({
            data: mockResponses.createOrUpdateFileContents
          })
        },
        pulls: {
          create: jest.fn().mockResolvedValue({ data: mockResponses.createPullRequest })
        }
      }
    };
  }
}
