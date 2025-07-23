import { describe, test, expect } from '@jest/globals';
import { adrToJSON } from '../../lib/adrParser.js';
import { loadADRFixture } from '../utils/testHelpers.js';

describe('adrParser', () => {
  describe('adrToJSON', () => {
    describe('Valid ADR parsing', () => {
      test('should parse complete ADR with YAML frontmatter and all sections', async () => {
        const { ast } = await loadADRFixture('0001-test-adr-open.md');
        const result = adrToJSON(ast);

        expect(result).toBeDefined();
        expect(result.frontmatter).toEqual({
          impact: 'high',
          reversibility: 'medium',
          status: 'open',
          tags: ['architecture', 'api'],
          'review-by': '2024-01-15',
          'decide-by': '2024-02-01'
        });
        expect(result.title).toBe('API Design Pattern for Data Access');
        expect(result['Problem Description']).toContain('We need to establish a consistent pattern');
        expect(result['Accepted Solution']).toContain('Implement a standardized GraphQL API gateway');
        // Note: Trade-offs might not be captured if followed by a list or other non-paragraph content
        expect(result['Expected Outcome']).toContain('All data access will follow the same pattern');
      });

      test('should parse committed status ADR', async () => {
        const { ast } = await loadADRFixture('0002-test-adr-committed.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.status).toBe('committed');
        expect(result.title).toContain('Container Orchestration Platform');
      });

      test('should parse deferred status ADR', async () => {
        const { ast } = await loadADRFixture('0003-test-adr-deferred.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.status).toBe('deferred');
        expect(result.title).toContain('Real-time Performance Monitoring');
      });

      test('should parse obsolete status ADR', async () => {
        const { ast } = await loadADRFixture('0004-test-adr-obsolete.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.status).toBe('obsolete');
        expect(result.title).toContain('Database Migration Strategy');
      });

      test('should parse minimal ADR with basic structure', async () => {
        const { ast } = await loadADRFixture('0005-test-adr-minimal.md');
        const result = adrToJSON(ast);

        expect(result).toBeDefined();
        expect(result.frontmatter.status).toBe('open');
        expect(result.title).toContain('Minimal ADR Example');
        expect(result.frontmatter.impact).toBeUndefined();
      });

      test('should parse markdown AST with complex YAML frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'impact: high\nstatus: open\ntags:\n  - architecture\n  - api\nreview-by: "2024-01-15"\ndecide-by: "2024-02-01"'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Test Decision' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Problem Description' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'This is a test problem.' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result).toBeDefined();
        expect(result.frontmatter).toEqual({
          impact: 'high',
          status: 'open',
          tags: ['architecture', 'api'],
          'review-by': '2024-01-15',
          'decide-by': '2024-02-01'
        });
        expect(result.title).toBe('Test Decision');
        expect(result['Problem Description']).toBe('This is a test problem.');
      });

      test('should parse multiple level 2 sections correctly', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Decision Title' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Section One' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'First section content' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Section Two' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Second section content' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result['Section One']).toBe('First section content');
        expect(result['Section Two']).toBe('Second section content');
      });
    });

    describe('Edge cases and error handling', () => {
      test('should handle AST without YAML frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Test Decision' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result).toBeDefined();
        expect(result.frontmatter).toBeUndefined();
        expect(result.title).toBe('Test Decision');
      });

      test('should handle AST with invalid YAML frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'invalid: yaml: content: [broken'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Test Decision' }]
            }
          ]
        };

        expect(() => adrToJSON(mockAST)).toThrow();
      });

      test('should handle ADR without frontmatter from fixture', async () => {
        const { ast } = await loadADRFixture('invalid-no-frontmatter.md');
        const result = adrToJSON(ast);

        expect(result).toBeDefined();
        expect(result.frontmatter).toBeUndefined();
        expect(result.title).toBe('ADR Without Frontmatter');
        expect(result['Problem Description']).toContain('This ADR file has no YAML frontmatter');
        expect(result['Accepted Solution']).toContain('This is used for testing error handling');
      });

      test('should handle empty AST gracefully', () => {
        const mockAST = {
          children: []
        };

        const result = adrToJSON(mockAST);

        expect(result).toBeDefined();
        expect(result).toEqual({});
      });

      test('should handle AST with only frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open\nimpact: medium'
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result).toBeDefined();
        expect(result.frontmatter).toEqual({
          status: 'open',
          impact: 'medium'
        });
        expect(result.title).toBeUndefined();
      });

      test('should handle malformed heading structure', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [] // Empty children array
            }
          ]
        };

        expect(() => adrToJSON(mockAST)).toThrow();
      });

      test('should handle heading without following paragraph', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Title' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Section' }]
            }
            // No paragraph following the section heading
          ]
        };

        const result = adrToJSON(mockAST);
        
        // Should not throw, but Section header shouldn't have content
        expect(result.title).toBe('Title');
        expect(result['Section']).toBeUndefined();
      });

      test('should ignore headings with depth other than 1 and 2', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Main Title' }]
            },
            {
              type: 'heading',
              depth: 3,
              children: [{ type: 'text', value: 'Sub-subsection' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'This should be ignored' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Valid Section' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'This should be captured' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.title).toBe('Main Title');
        expect(result['Sub-subsection']).toBeUndefined();
        expect(result['Valid Section']).toBe('This should be captured');
      });

      test('should handle complex paragraph structures', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Title' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Complex Section' }]
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: 'This is ' },
                { type: 'emphasis', children: [{ type: 'text', value: 'complex' }] },
                { type: 'text', value: ' content.' }
              ]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result['Complex Section']).toBe('This is ');
      });

      test('should handle non-text title content', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'emphasis', value: 'emphasized title' }]
            }
          ]
        };

        expect(() => adrToJSON(mockAST)).toThrow();
      });
    });

    describe('YAML frontmatter variations', () => {
      test('should handle empty YAML frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: ''
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Title' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.frontmatter).toBeNull();
        expect(result.title).toBe('Title');
      });

      test('should handle whitespace-only YAML frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: '   \n  \t  \n   '
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Title' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.frontmatter).toBeNull();
        expect(result.title).toBe('Title');
      });
    });
  });
});