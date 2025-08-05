import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MockFactory } from '../utils/mockFactory.js';
import { setupTestEnvironment, cleanupTestEnvironment, createTestADRData } from '../utils/testHelpers.js';
import { TEST_CONFIG } from '../config/testConfig.js';

// Mock Octokit at module level before importing the module that uses it
const mockOctokit = {
  graphql: jest.fn(),
  request: jest.fn()
};

// Mock the Octokit constructor - use the correct path and ensure it runs before adrs.js import
jest.unstable_mockModule('octokit', () => ({
  Octokit: jest.fn(() => mockOctokit)
}));

// Import the module to be tested AFTER setting up the mock
const { getAdrFiles, createAdrFile, getPullRequestsByFile } = await import('../../lib/adrs.js');

describe('adrs.js', () => {
  let originalEnv = {};

  beforeEach(() => {
    // Store original environment and set up test environment
    originalEnv = { ...process.env };
    setupTestEnvironment();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    cleanupTestEnvironment(originalEnv);
  });

  // Canary test to verify setup works
  describe('Test Infrastructure', () => {
    test('canary test - should have proper test environment setup', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.GITHUB_TOKEN).toBe('ghp_test-github-token');
      expect(process.env.GITHUB_USER).toBe('test-user');
      expect(process.env.GITHUB_REPO).toBe('test-repo');
      expect(process.env.GITHUB_PATH_TO_ADRS).toBe('docs/decisions');
      expect(process.env.GITHUB_ADR_REGEX).toBe('\\d{4}-.*\\.md');
    });

    test('should have mock Octokit available', () => {
      expect(mockOctokit).toBeDefined();
      expect(mockOctokit.graphql).toBeDefined();
      expect(mockOctokit.request).toBeDefined();
    });

    test('should have test configuration available', () => {
      expect(TEST_CONFIG).toBeDefined();
      expect(TEST_CONFIG.adr).toBeDefined();
      expect(TEST_CONFIG.github).toBeDefined();
    });
  });

  describe('getAdrFiles()', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockOctokit.graphql.mockReset();
    });

    describe('Basic Functionality', () => {
      test('should return ADR files with no filters', async () => {
        // Setup mock response
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-test-decision.md',
            content: MockFactory.createADRContent('Test Decision', 'open', {
              impact: 'high',
              tags: ['architecture']
            })
          },
          {
            name: '0002-another-decision.md',
            content: MockFactory.createADRContent('Another Decision', 'committed', {
              impact: 'medium',
              tags: ['infrastructure']
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);

        const result = await getAdrFiles({});

        expect(mockOctokit.graphql).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('0001-test-decision.md');
        expect(result[1].name).toBe('0002-another-decision.md');
        expect(result[0].data.frontmatter.status).toBe('open');
        expect(result[1].data.frontmatter.status).toBe('committed');
      });

      test('should filter out non-ADR files based on regex', async () => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-valid-adr.md',
            content: MockFactory.createADRContent('Valid ADR', 'open')
          },
          {
            name: 'README.md',
            content: '# README\nThis is not an ADR'
          },
          {
            name: 'invalid-file.txt',
            content: 'Not an ADR file'
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);

        const result = await getAdrFiles({});

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('0001-valid-adr.md');
      });

      test('should generate correct GitHub URLs for ADRs', async () => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-test-decision.md',
            content: MockFactory.createADRContent('Test Decision', 'open')
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);

        const result = await getAdrFiles({});

        expect(result[0].githubUrl).toBe(
          `https://github.com/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/blob/${process.env.GITHUB_DEFAULT_BRANCH}/${process.env.GITHUB_PATH_TO_ADRS}/0001-test-decision.md`
        );
      });
    });

    describe('Status Filtering', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-open-adr.md',
            content: MockFactory.createADRContent('Open ADR', 'open')
          },
          {
            name: '0002-committed-adr.md',
            content: MockFactory.createADRContent('Committed ADR', 'committed')
          },
          {
            name: '0003-deferred-adr.md',
            content: MockFactory.createADRContent('Deferred ADR', 'deferred')
          },
          {
            name: '0004-obsolete-adr.md',
            content: MockFactory.createADRContent('Obsolete ADR', 'obsolete')
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should filter by single status', async () => {
        const result = await getAdrFiles({ status: ['open'] });

        expect(result).toHaveLength(1);
        expect(result[0].data.frontmatter.status).toBe('open');
      });

      test('should filter by multiple statuses', async () => {
        const result = await getAdrFiles({ status: ['open', 'committed'] });

        expect(result).toHaveLength(2);
        expect(result.map(adr => adr.data.frontmatter.status)).toEqual(
          expect.arrayContaining(['open', 'committed'])
        );
      });

      test('should return empty array when no ADRs match status filter', async () => {
        const result = await getAdrFiles({ status: ['nonexistent'] });

        expect(result).toHaveLength(0);
      });
    });

    describe('Impact Filtering', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-high-impact.md',
            content: MockFactory.createADRContent('High Impact ADR', 'open', {
              impact: 'high'
            })
          },
          {
            name: '0002-medium-impact.md',
            content: MockFactory.createADRContent('Medium Impact ADR', 'open', {
              impact: 'medium'
            })
          },
          {
            name: '0003-low-impact.md',
            content: MockFactory.createADRContent('Low Impact ADR', 'open', {
              impact: 'low'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should filter by impact level', async () => {
        const result = await getAdrFiles({ impact: ['high'] });

        expect(result).toHaveLength(1);
        expect(result[0].data.frontmatter.impact).toBe('high');
      });

      test('should filter by multiple impact levels', async () => {
        const result = await getAdrFiles({ impact: ['high', 'medium'] });

        expect(result).toHaveLength(2);
        expect(result.map(adr => adr.data.frontmatter.impact)).toEqual(
          expect.arrayContaining(['high', 'medium'])
        );
      });
    });

    describe('Tag Filtering', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-architecture-adr.md',
            content: MockFactory.createADRContent('Architecture ADR', 'open', {
              tags: ['architecture', 'api']
            })
          },
          {
            name: '0002-infrastructure-adr.md',
            content: MockFactory.createADRContent('Infrastructure ADR', 'open', {
              tags: ['infrastructure', 'deployment']
            })
          },
          {
            name: '0003-multi-tag-adr.md',
            content: MockFactory.createADRContent('Multi Tag ADR', 'open', {
              tags: ['architecture', 'infrastructure', 'security']
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should filter by single tag', async () => {
        const result = await getAdrFiles({ tags: ['architecture'] });

        expect(result).toHaveLength(2);
        result.forEach(adr => {
          expect(adr.data.frontmatter.tags).toContain('architecture');
        });
      });

      test('should filter by multiple tags (OR logic)', async () => {
        const result = await getAdrFiles({ tags: ['api', 'deployment'] });

        expect(result).toHaveLength(2);
        expect(result.map(adr => adr.name)).toEqual(
          expect.arrayContaining(['0001-architecture-adr.md', '0002-infrastructure-adr.md'])
        );
      });
    });

    describe('Date Filtering', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-recent-committed.md',
            content: MockFactory.createADRContent('Recent Committed', 'committed', {
              'committed-on': '2024-01-15'
            })
          },
          {
            name: '0002-old-committed.md',
            content: MockFactory.createADRContent('Old Committed', 'committed', {
              'committed-on': '2023-06-01'
            })
          },
          {
            name: '0003-urgent-open.md',
            content: MockFactory.createADRContent('Urgent Open', 'open', {
              'decide-by': '2024-01-01'
            })
          },
          {
            name: '0004-future-open.md',
            content: MockFactory.createADRContent('Future Open', 'open', {
              'decide-by': '2024-12-31'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should filter by committedAfter date', async () => {
        const result = await getAdrFiles({ 
          committedAfter: Date.parse('2024-01-01') 
        });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('0001-recent-committed.md');
      });

      test('should filter by decideBefore date for open ADRs', async () => {
        const result = await getAdrFiles({ 
          decideBefore: Date.parse('2024-06-01') 
        });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('0003-urgent-open.md');
        expect(result[0].data.frontmatter.status).toBe('open');
      });
    });

    describe('Error Handling', () => {
      test('should handle GraphQL errors gracefully', async () => {
        mockOctokit.graphql.mockRejectedValue(new Error('GraphQL API Error'));

        await expect(getAdrFiles({})).rejects.toThrow('GraphQL API Error');
        expect(mockOctokit.graphql).toHaveBeenCalledTimes(1);
      });

      test('should handle empty repository response', async () => {
        mockOctokit.graphql.mockResolvedValue({
          repository: {
            object: {
              entries: []
            }
          }
        });

        const result = await getAdrFiles({});

        expect(result).toHaveLength(0);
      });

      test('should handle ADRs without frontmatter', async () => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-no-frontmatter.md',
            content: '# ADR Without Frontmatter\n\nThis ADR has no frontmatter.'
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);

        const result = await getAdrFiles({ status: ['open'] });

        // Should be filtered out because it has no frontmatter
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('createAdrFile()', () => {
    beforeEach(() => {
      mockOctokit.graphql.mockReset();
      mockOctokit.request.mockReset();
    });

    test('should create ADR file with all required steps', async () => {
      // Mock the sequence of GitHub API calls
      mockOctokit.graphql
        // getMainSHA
        .mockResolvedValueOnce({
          repository: {
            refs: {
              edges: [{
                node: {
                  target: {
                    oid: TEST_CONFIG.github.testShas.mainBranch
                  }
                }
              }]
            }
          }
        })
        // getTemplateContents
        .mockResolvedValueOnce({
          repository: {
            object: {
              text: MockFactory.createADRContent('{{TITLE}}', 'open', {
                impact: '{{IMPACT}}'
              })
            }
          }
        })
        // getNewADRFilename - list existing files
        .mockResolvedValueOnce({
          repository: {
            object: {
              entries: [
                { name: '0001-existing-adr.md' },
                { name: '0002-another-adr.md' }
              ]
            }
          }
        })
        // commitNewADR
        .mockResolvedValueOnce({
          createCommitOnBranch: {
            commit: {
              oid: TEST_CONFIG.github.testShas.featureBranch
            }
          }
        })
        // createPullRequest - get repo ID
        .mockResolvedValueOnce({
          repository: {
            id: 'test-repo-id'
          }
        })
        // createPullRequest - create PR
        .mockResolvedValueOnce({
          createPullRequest: {
            pullRequest: {
              url: 'https://github.com/test-user/test-repo/pull/123'
            }
          }
        });

      // Mock createNewBranch
      mockOctokit.request.mockResolvedValueOnce({
        data: MockFactory.createBranchResponse('feature/test-branch')
      });

      const options = {
        title: 'Test Decision',
        branch: 'test-branch',
        impact: 'high'
      };

      const result = await createAdrFile(options);

      expect(result).toEqual({
        pullRequestUrl: 'https://github.com/test-user/test-repo/pull/123',
        adrFile: 'docs/decisions/0003-test-branch.md'
      });

      // Verify all the expected calls were made
      expect(mockOctokit.graphql).toHaveBeenCalledTimes(6);
      expect(mockOctokit.request).toHaveBeenCalledTimes(1);
    });

    test('should handle branch creation errors', async () => {
      // Mock getMainSHA to succeed
      mockOctokit.graphql.mockResolvedValueOnce({
        repository: {
          refs: {
            edges: [{
              node: {
                target: {
                  oid: TEST_CONFIG.github.testShas.mainBranch
                }
              }
            }]
          }
        }
      });

      // Mock createNewBranch to fail
      mockOctokit.request.mockRejectedValue(new Error('Branch already exists'));

      const options = {
        title: 'Test Decision',
        branch: 'existing-branch',
        impact: 'high'
      };

      await expect(createAdrFile(options)).rejects.toThrow('Branch already exists');
    });

    test('should increment ADR file number correctly', async () => {
      // Setup mocks for successful creation with existing ADRs
      mockOctokit.graphql
        .mockResolvedValueOnce({
          repository: {
            refs: {
              edges: [{
                node: {
                  target: {
                    oid: TEST_CONFIG.github.testShas.mainBranch
                  }
                }
              }]
            }
          }
        })
        .mockResolvedValueOnce({
          repository: {
            object: {
              text: MockFactory.createADRContent('Template', 'open')
            }
          }
        })
        .mockResolvedValueOnce({
          repository: {
            object: {
              entries: [
                { name: '0001-first-adr.md' },
                { name: '0005-fifth-adr.md' },
                { name: '0003-third-adr.md' },
                { name: 'README.md' } // Should be ignored
              ]
            }
          }
        })
        .mockResolvedValueOnce({
          createCommitOnBranch: {
            commit: {
              oid: TEST_CONFIG.github.testShas.featureBranch
            }
          }
        })
        .mockResolvedValueOnce({
          repository: {
            id: 'test-repo-id'
          }
        })
        .mockResolvedValueOnce({
          createPullRequest: {
            pullRequest: {
              url: 'https://github.com/test-user/test-repo/pull/124'
            }
          }
        });

      mockOctokit.request.mockResolvedValueOnce({
        data: MockFactory.createBranchResponse('feature/new-branch')
      });

      const options = {
        title: 'New Decision',
        branch: 'new-branch',
        impact: 'medium'
      };

      const result = await createAdrFile(options);

      // Should increment from highest existing number (0005) to 0006
      expect(result.adrFile).toBe('docs/decisions/0006-new-branch.md');
    });
  });

  describe('Filtering Logic (checkFilter)', () => {
    // These tests focus on the internal filtering logic through getAdrFiles
    beforeEach(() => {
      mockOctokit.graphql.mockReset();
    });

    describe('Complex Filter Combinations', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-complex-filter-test.md',
            content: MockFactory.createADRContent('Complex Test', 'open', {
              impact: 'high',
              tags: ['architecture', 'api'],
              'decide-by': '2024-01-15'
            })
          },
          {
            name: '0002-another-complex.md',
            content: MockFactory.createADRContent('Another Complex', 'committed', {
              impact: 'medium',
              tags: ['infrastructure'],
              'committed-on': '2024-02-01'
            })
          },
          {
            name: '0003-multi-criteria.md',
            content: MockFactory.createADRContent('Multi Criteria', 'open', {
              impact: 'high',
              tags: ['architecture', 'security'],
              'decide-by': '2024-03-01'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should combine status and impact filters', async () => {
        const result = await getAdrFiles({ 
          status: ['open'], 
          impact: ['high'] 
        });

        expect(result).toHaveLength(2);
        result.forEach(adr => {
          expect(adr.data.frontmatter.status).toBe('open');
          expect(adr.data.frontmatter.impact).toBe('high');
        });
      });

      test('should combine status, impact, and tag filters', async () => {
        const result = await getAdrFiles({ 
          status: ['open'], 
          impact: ['high'],
          tags: ['architecture']
        });

        expect(result).toHaveLength(2);
        result.forEach(adr => {
          expect(adr.data.frontmatter.status).toBe('open');
          expect(adr.data.frontmatter.impact).toBe('high');
          expect(adr.data.frontmatter.tags).toContain('architecture');
        });
      });

      test('should return empty when no ADRs match all criteria', async () => {
        const result = await getAdrFiles({ 
          status: ['committed'], 
          impact: ['high'],
          tags: ['nonexistent']
        });

        expect(result).toHaveLength(0);
      });
    });

    describe('Edge Cases in Filtering', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-no-frontmatter.md',
            content: '# ADR Without Frontmatter\n\nThis has no frontmatter.'
          },
          {
            name: '0002-empty-tags.md',
            content: MockFactory.createADRContent('Empty Tags', 'open', {
              impact: 'low',
              tags: []
            })
          },
          {
            name: '0003-missing-dates.md',
            content: MockFactory.createADRContent('Missing Dates', 'committed', {
              impact: 'medium',
              tags: ['test']
              // No committed-on or decide-by dates
            })
          },
          {
            name: '0004-invalid-dates.md',
            content: MockFactory.createADRContent('Invalid Dates', 'open', {
              impact: 'high',
              tags: ['test'],
              'decide-by': 'invalid-date-format'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should exclude ADRs without frontmatter when filters are applied', async () => {
        const result = await getAdrFiles({ status: ['open'] });

        expect(result).toHaveLength(2); // Should exclude the one without frontmatter
        result.forEach(adr => {
          expect(adr.data.frontmatter).toBeDefined();
        });
      });

      test('should handle empty tags array correctly', async () => {
        const result = await getAdrFiles({ tags: ['architecture'] });

        expect(result).toHaveLength(0); // Empty tags shouldn't match any tag filter
      });

      test('should handle missing date fields gracefully', async () => {
        const result = await getAdrFiles({ 
          committedAfter: Date.parse('2024-01-01') 
        });

        expect(result).toHaveLength(0); // Should exclude ADRs without committed-on dates
      });

      test('should handle invalid date formats gracefully', async () => {
        const result = await getAdrFiles({ 
          decideBefore: Date.parse('2024-06-01') 
        });

        expect(result).toHaveLength(0); // Should exclude ADRs with invalid decide-by dates
      });
    });

    describe('Date Filter Edge Cases', () => {
      beforeEach(() => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-boundary-date.md',
            content: MockFactory.createADRContent('Boundary Date', 'committed', {
              'committed-on': '2024-01-01'
            })
          },
          {
            name: '0002-exact-match.md',
            content: MockFactory.createADRContent('Exact Match', 'open', {
              'decide-by': '2024-06-01'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);
      });

      test('should handle exact boundary dates for committedAfter', async () => {
        const result = await getAdrFiles({ 
          committedAfter: Date.parse('2024-01-01') 
        });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('0001-boundary-date.md');
      });

      test('should handle exact boundary dates for decideBefore', async () => {
        const result = await getAdrFiles({ 
          decideBefore: Date.parse('2024-06-01') 
        });

        expect(result).toHaveLength(0); // decideBefore should be exclusive
      });

      test('should require open status for decideBefore filter', async () => {
        const mockResponse = MockFactory.createADRFilesResponse([
          {
            name: '0001-committed-with-decide-by.md',
            content: MockFactory.createADRContent('Committed with Decide By', 'committed', {
              'decide-by': '2024-01-01'
            })
          }
        ]);

        mockOctokit.graphql.mockResolvedValue(mockResponse);

        const result = await getAdrFiles({ 
          decideBefore: Date.parse('2024-06-01') 
        });

        expect(result).toHaveLength(0); // Should exclude non-open ADRs
      });
    });
  });

  describe('getPullRequestsByFile()', () => {
    beforeEach(() => {
      mockOctokit.graphql.mockReset();
    });

    test('should return pull requests grouped by ADR file', async () => {
      const mockResponse = {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  title: 'Add new ADR',
                  url: 'https://github.com/test-user/test-repo/pull/1',
                  body: 'This adds a new architectural decision',
                  createdAt: '2024-01-01T00:00:00Z',
                  state: 'MERGED',
                  files: {
                    edges: [
                      {
                        node: {
                          path: 'docs/decisions/0001-test-decision.md'
                        }
                      }
                    ]
                  }
                }
              },
              {
                node: {
                  title: 'Update existing ADR',
                  url: 'https://github.com/test-user/test-repo/pull/2',
                  body: 'This updates an existing decision',
                  createdAt: '2024-01-02T00:00:00Z',
                  state: 'OPEN',
                  files: {
                    edges: [
                      {
                        node: {
                          path: 'docs/decisions/0001-test-decision.md'
                        }
                      }
                    ]
                  }
                }
              }
            ],
            pageInfo: {
              hasPreviousPage: false,
              startCursor: null
            }
          }
        }
      };

      mockOctokit.graphql.mockResolvedValue(mockResponse);

      const result = await getPullRequestsByFile();

      expect(Object.keys(result)).toContain('0001-test-decision.md');
      expect(result['0001-test-decision.md']).toHaveLength(2);
      expect(result['0001-test-decision.md'][0].title).toBe('Add new ADR');
      expect(result['0001-test-decision.md'][1].title).toBe('Update existing ADR');
    });

    test('should handle pagination correctly', async () => {
      // First page response
      const firstPageResponse = {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  title: 'First PR',
                  url: 'https://github.com/test-user/test-repo/pull/1',
                  body: 'First PR body',
                  createdAt: '2024-01-01T00:00:00Z',
                  state: 'MERGED',
                  files: {
                    edges: [
                      {
                        node: {
                          path: 'docs/decisions/0001-first-adr.md'
                        }
                      }
                    ]
                  }
                }
              }
            ],
            pageInfo: {
              hasPreviousPage: true,
              startCursor: 'cursor-123'
            }
          }
        }
      };

      // Second page response
      const secondPageResponse = {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  title: 'Second PR',
                  url: 'https://github.com/test-user/test-repo/pull/2',
                  body: 'Second PR body',
                  createdAt: '2024-01-02T00:00:00Z',
                  state: 'OPEN',
                  files: {
                    edges: [
                      {
                        node: {
                          path: 'docs/decisions/0002-second-adr.md'
                        }
                      }
                    ]
                  }
                }
              }
            ],
            pageInfo: {
              hasPreviousPage: false,
              startCursor: null
            }
          }
        }
      };

      mockOctokit.graphql
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const result = await getPullRequestsByFile();

      expect(mockOctokit.graphql).toHaveBeenCalledTimes(2);
      expect(Object.keys(result)).toContain('0001-first-adr.md');
      expect(Object.keys(result)).toContain('0002-second-adr.md');
    });

    test('should filter out non-ADR files', async () => {
      const mockResponse = {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  title: 'Mixed PR',
                  url: 'https://github.com/test-user/test-repo/pull/1',
                  body: 'Changes multiple files',
                  createdAt: '2024-01-01T00:00:00Z',
                  state: 'MERGED',
                  files: {
                    edges: [
                      {
                        node: {
                          path: 'docs/decisions/0001-valid-adr.md'
                        }
                      },
                      {
                        node: {
                          path: 'src/app.js'
                        }
                      },
                      {
                        node: {
                          path: 'README.md'
                        }
                      }
                    ]
                  }
                }
              }
            ],
            pageInfo: {
              hasPreviousPage: false,
              startCursor: null
            }
          }
        }
      };

      mockOctokit.graphql.mockResolvedValue(mockResponse);

      const result = await getPullRequestsByFile();

      // Should only include the ADR file
      expect(Object.keys(result)).toEqual(['0001-valid-adr.md']);
      expect(result['0001-valid-adr.md']).toHaveLength(1);
    });
  });
});