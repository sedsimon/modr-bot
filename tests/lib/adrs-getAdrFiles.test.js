import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MockFactory } from '../utils/mockFactory.js';

// Mock the Octokit constructor and methods
const mockGraphql = jest.fn();
jest.mock('octokit', () => ({
  Octokit: jest.fn(() => ({
    graphql: mockGraphql
  }))
}));

describe('getAdrFiles', () => {
  let originalEnv;
  let getAdrFiles;

  beforeEach(async () => {
    // Store original environment
    originalEnv = { ...process.env };

    // Set up test environment
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_USER = 'testuser';
    process.env.GITHUB_REPO = 'testrepo';
    process.env.GITHUB_DEFAULT_BRANCH = 'main';
    process.env.GITHUB_PATH_TO_ADRS = 'docs/decisions';
    process.env.GITHUB_ADR_REGEX = '\\d{4}-.*\\.md$';
    process.env.ADR_PARSER = './adrParser.js';

    // Clear all mocks
    jest.clearAllMocks();
    mockGraphql.mockReset();

    // Import the module after setting up environment and mocks
    const adrsModule = await import('../../lib/adrs.js');
    getAdrFiles = adrsModule.getAdrFiles;
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });

    // Reset module cache to ensure clean state for next test
    jest.resetModules();
  });

  describe('Success Path Testing', () => {
    test('should return all ADR files when no filters are provided', async () => {
      const testData = MockFactory.createADRFilesResponse();
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({});

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.stringContaining('query ($repo: String!, $owner: String!, $adr_ref: String!)'),
        {
          owner: 'testuser',
          repo: 'testrepo',
          adr_ref: 'main:docs/decisions'
        }
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('githubUrl');
      expect(result[0]).toHaveProperty('data');
    });

    test('should include proper GitHub URLs in results', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-test.md', content: MockFactory.createADRContent('Test') }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({});

      expect(result[0].githubUrl).toBe(
        'https://github.com/testuser/testrepo/blob/main/docs/decisions/0001-test.md'
      );
    });

    test('should process ADR files in sequential order', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-first.md', content: MockFactory.createADRContent('First') },
        { name: '0002-second.md', content: MockFactory.createADRContent('Second') }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({});

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('0001-first.md');
      expect(result[1].name).toBe('0002-second.md');
    });

    test('should filter by status when provided', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-open.md', content: MockFactory.createADRContent('Open', 'open') },
        { name: '0002-committed.md', content: MockFactory.createADRContent('Committed', 'committed') }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ status: ['open'] });

      // Should filter to only open status ADRs
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-open.md');
    });

    test('should filter by multiple status values', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-open.md', content: MockFactory.createADRContent('Open', 'open') },
        { name: '0002-committed.md', content: MockFactory.createADRContent('Committed', 'committed') },
        { name: '0003-deferred.md', content: MockFactory.createADRContent('Deferred', 'deferred') }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ status: ['open', 'committed'] });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['0001-open.md', '0002-committed.md']);
    });

    test('should filter by tags when provided', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-api.md', content: MockFactory.createADRContent('API', 'open', { tags: ['api'] }) },
        { name: '0002-ui.md', content: MockFactory.createADRContent('UI', 'open', { tags: ['ui'] }) }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ tags: ['api'] });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-api.md');
    });

    test('should filter by impact level when provided', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-high.md', content: MockFactory.createADRContent('High', 'open', { impact: 'high' }) },
        { name: '0002-low.md', content: MockFactory.createADRContent('Low', 'open', { impact: 'low' }) }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ impact: ['high'] });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-high.md');
    });

    test('should apply multiple filters simultaneously', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-match.md',
          content: MockFactory.createADRContent('Match', 'open', {
            impact: 'high',
            tags: ['api']
          })
        },
        {
          name: '0002-no-match.md',
          content: MockFactory.createADRContent('No Match', 'committed', {
            impact: 'low',
            tags: ['ui']
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({
        status: ['open'],
        impact: ['high'],
        tags: ['api']
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-match.md');
    });

    test('should return empty array when combined filters match nothing', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-partial.md',
          content: MockFactory.createADRContent('Partial', 'open', {
            impact: 'low',
            tags: ['api']
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({
        status: ['open'],
        impact: ['high'],
        tags: ['api']
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Error Handling Testing', () => {
    test('should throw error when GraphQL query fails', async () => {
      const error = new Error('GraphQL query failed');
      mockGraphql.mockRejectedValue(error);

      await expect(getAdrFiles({})).rejects.toThrow('GraphQL query failed');
    });

    test('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockGraphql.mockRejectedValue(timeoutError);

      await expect(getAdrFiles({})).rejects.toThrow('Network timeout');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Bad credentials');
      authError.status = 401;
      mockGraphql.mockRejectedValue(authError);

      await expect(getAdrFiles({})).rejects.toThrow('Bad credentials');
    });

    test('should handle rate limit errors', async () => {
      const rateLimitError = new Error('API rate limit exceeded');
      rateLimitError.status = 403;
      mockGraphql.mockRejectedValue(rateLimitError);

      await expect(getAdrFiles({})).rejects.toThrow('API rate limit exceeded');
    });

    test('should handle repository not found', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;
      mockGraphql.mockRejectedValue(notFoundError);

      await expect(getAdrFiles({})).rejects.toThrow('Not Found');
    });

    test('should handle empty repository response', async () => {
      mockGraphql.mockResolvedValue({
        repository: {
          object: {
            entries: []
          }
        }
      });

      const result = await getAdrFiles({});

      expect(result).toHaveLength(0);
    });

    test('should handle null repository response', async () => {
      mockGraphql.mockResolvedValue({
        repository: {
          object: null
        }
      });

      await expect(getAdrFiles({})).rejects.toThrow();
    });

    test('should handle malformed GraphQL response', async () => {
      mockGraphql.mockResolvedValue({
        repository: null
      });

      await expect(getAdrFiles({})).rejects.toThrow();
    });

    test('should handle invalid filter parameters gracefully', async () => {
      const testData = MockFactory.createADRFilesResponse();
      mockGraphql.mockResolvedValue(testData);

      // Should not throw error for unknown filter properties
      const result = await getAdrFiles({ invalidFilter: 'value' });

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Edge Case Testing', () => {
    test('should handle files that do not match ADR regex', async () => {
      const testData = {
        repository: {
          object: {
            entries: [
              {
                name: 'README.md', // Does not match ADR regex
                object: {
                  text: '# README\n\nThis is a readme file.'
                }
              },
              {
                name: '0001-valid-adr.md', // Matches ADR regex
                object: {
                  text: MockFactory.createADRContent('Valid ADR')
                }
              }
            ]
          }
        }
      };
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({});

      // Should only include the ADR file, not the README
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-valid-adr.md');
    });

    test('should handle special characters in file names and content', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-special-chars-åäö.md',
          content: MockFactory.createADRContent('Special Chars åäö', 'open', { tags: ['åäö', 'test'] })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ tags: ['åäö'] });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-special-chars-åäö.md');
    });

    test('should handle empty arrays in filter parameters', async () => {
      const testData = MockFactory.createADRFilesResponse();
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({
        status: [],
        tags: [],
        impact: []
      });

      expect(result).toBeInstanceOf(Array);
    });

    test('should handle boundary conditions in date filtering', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-exact-date.md',
          content: MockFactory.createADRContent('Exact Date', 'committed', {
            'committed-on': '2023-01-01'
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      // Test exact boundary
      const result = await getAdrFiles({
        committedAfter: new Date('2023-01-01').getTime()
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('Async Behavior Testing', () => {
    test('should handle concurrent processing efficiently', async () => {
      const testData = MockFactory.createADRFilesResponse(
        Array.from({ length: 10 }, (_, i) => ({
          name: `000${i+1}-test.md`,
          content: MockFactory.createADRContent(`Test ${i+1}`)
        }))
      );
      mockGraphql.mockResolvedValue(testData);

      const startTime = Date.now();
      const result = await getAdrFiles({});
      const endTime = Date.now();

      expect(result).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    test('should maintain async execution performance under load', async () => {
      // Create a large dataset
      const largeTestData = MockFactory.createADRFilesResponse(
        Array.from({ length: 50 }, (_, i) => ({
          name: `${String(i+1).padStart(4, '0')}-large-test.md`,
          content: MockFactory.createADRContent(`Large Test ${i+1}`)
        }))
      );
      mockGraphql.mockResolvedValue(largeTestData);

      const startTime = Date.now();
      const result = await getAdrFiles({});
      const endTime = Date.now();

      expect(result).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Performance Testing', () => {
    test('should execute within performance requirements', async () => {
      const testData = MockFactory.createADRFilesResponse();
      mockGraphql.mockResolvedValue(testData);

      const startTime = Date.now();
      await getAdrFiles({});
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds requirement
    });

    test('should handle large datasets efficiently', async () => {
      const largeDataset = MockFactory.createADRFilesResponse(
        Array.from({ length: 100 }, (_, i) => ({
          name: `${String(i+1).padStart(4, '0')}-large.md`,
          content: MockFactory.createADRContent(`Large ${i+1}`)
        }))
      );
      mockGraphql.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await getAdrFiles({});
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('checkFilter Function Testing', () => {
    test('should accept everything when no options provided', async () => {
      const testData = MockFactory.createADRFilesResponse();
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({});

      expect(result.length).toBeGreaterThan(0);
    });

    test('should reject entries with missing frontmatter when filters applied', async () => {
      // This test verifies that checkFilter properly handles missing frontmatter
      const testData = {
        repository: {
          object: {
            entries: [{
              name: '0001-no-frontmatter.md',
              object: {
                text: '# ADR without frontmatter\n\nThis has no YAML frontmatter.'
              }
            }]
          }
        }
      };
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ status: ['open'] });

      expect(result).toHaveLength(0); // Should be filtered out due to missing frontmatter
    });

    test('should handle date filtering for committedAfter', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-recent.md',
          content: MockFactory.createADRContent('Recent', 'committed', {
            'committed-on': '2023-12-01'
          })
        },
        {
          name: '0002-old.md',
          content: MockFactory.createADRContent('Old', 'committed', {
            'committed-on': '2023-01-01'
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ committedAfter: new Date('2023-06-01').getTime() });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-recent.md');
    });

    test('should handle date filtering for decideBefore', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-urgent.md',
          content: MockFactory.createADRContent('Urgent', 'open', {
            'decide-by': '2023-12-01'
          })
        },
        {
          name: '0002-later.md',
          content: MockFactory.createADRContent('Later', 'open', {
            'decide-by': '2024-06-01'
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ decideBefore: new Date('2024-01-01').getTime() });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('0001-urgent.md');
    });

    test('should only apply decideBefore filter to open ADRs', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-committed.md',
          content: MockFactory.createADRContent('Committed', 'committed', {
            'decide-by': '2023-01-01'
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ decideBefore: new Date('2024-01-01').getTime() });

      expect(result).toHaveLength(0); // Committed ADRs should be excluded from decideBefore filter
    });

    test('should handle invalid date formats in filtering', async () => {
      const testData = MockFactory.createADRFilesResponse([
        {
          name: '0001-invalid-date.md',
          content: MockFactory.createADRContent('Invalid', 'committed', {
            'committed-on': 'invalid-date'
          })
        }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ committedAfter: new Date('2023-01-01').getTime() });

      expect(result).toHaveLength(0); // Should be filtered out due to invalid date
    });

    test('should handle tag filtering with OR logic', async () => {
      const testData = MockFactory.createADRFilesResponse([
        { name: '0001-api.md', content: MockFactory.createADRContent('API', 'open', { tags: ['api'] }) },
        { name: '0002-ui.md', content: MockFactory.createADRContent('UI', 'open', { tags: ['ui'] }) },
        { name: '0003-db.md', content: MockFactory.createADRContent('DB', 'open', { tags: ['database'] }) }
      ]);
      mockGraphql.mockResolvedValue(testData);

      const result = await getAdrFiles({ tags: ['api', 'ui'] });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['0001-api.md', '0002-ui.md']);
    });
  });
});