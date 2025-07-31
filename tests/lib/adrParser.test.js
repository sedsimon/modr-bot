import { describe, test, expect } from '@jest/globals';
import { adrToJSON } from '../../lib/adrParser.js';
import { loadADRFixture } from '../utils/testHelpers.js';

describe('adrParser', () => {
  describe('adrToJSON', () => {
    // Helper function to load ADR fixture
    const loadADRFixtureForTest = async (filename) => {
      const { ast } = await loadADRFixture(filename);
      return ast;
    };

    // Original tests
    test('should parse markdown AST with YAML frontmatter', () => {
      const mockAST = {
        children: [
          {
            type: 'yaml',
            value: 'impact: high\nstatus: open'
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
        status: 'open'
      });
      expect(result.title).toBe('Test Decision');
      expect(result['Problem Description']).toBe('This is a test problem.');
    });

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

    test('should handle empty AST gracefully', () => {
      const mockAST = {
        children: []
      };

      const result = adrToJSON(mockAST);
      expect(result).toEqual({});
    });

    // Frontmatter Edge Cases
    describe('Frontmatter Edge Cases', () => {
      test('should parse all supported frontmatter fields', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'impact: high\nreversibility: medium\nstatus: committed\ntags:\n  - architecture\n  - api\nreview-by: "2024-01-15"\ndecide-by: "2024-02-01"'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Complete ADR' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.frontmatter).toEqual({
          impact: 'high',
          reversibility: 'medium',
          status: 'committed',
          tags: ['architecture', 'api'],
          'review-by': '2024-01-15',
          'decide-by': '2024-02-01'
        });
        expect(result.title).toBe('Complete ADR');
      });

      test('should handle empty frontmatter', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: ''
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'ADR Title' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.frontmatter).toBeNull();
        expect(result.title).toBe('ADR Title');
      });

      test('should handle frontmatter with special characters and unicode', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'impact: high\ntags:\n  - "special chars & unicode: 测试"\n  - normal-tag'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Unicode Test 测试' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.frontmatter.tags).toContain('special chars & unicode: 测试');
        expect(result.title).toBe('Unicode Test 测试');
      });

      test('should handle malformed YAML gracefully', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'impact: high\nstatus: open\n: invalid key\nmalformed syntax'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'ADR Title' }]
            }
          ]
        };

        expect(() => adrToJSON(mockAST)).toThrow();
      });
    });

    // Markdown Structure Tests
    describe('Markdown Structure Tests', () => {
      test('should parse multiple level 2 headers with content', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Multi-Section ADR' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Problem Description' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'First problem content.' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Accepted Solution' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Solution content.' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Trade-offs' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Trade-offs content.' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.title).toBe('Multi-Section ADR');
        expect(result['Problem Description']).toBe('First problem content.');
        expect(result['Accepted Solution']).toBe('Solution content.');
        expect(result['Trade-offs']).toBe('Trade-offs content.');
      });

      test('should handle headers without following content gracefully', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'ADR Title' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Problem Description' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Another Header' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.title).toBe('ADR Title');
        expect(result['Problem Description']).toBeUndefined();
        expect(result['Another Header']).toBeUndefined();
      });

      test('should handle missing title (level 1 header)', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Problem Description' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Content without title.' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.title).toBeUndefined();
        expect(result['Problem Description']).toBe('Content without title.');
      });

      test('should handle empty sections gracefully', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'ADR Title' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Empty Section' }]
            },
            {
              type: 'paragraph',
              children: []
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result.title).toBe('ADR Title');
        expect(result['Empty Section']).toBeUndefined();
      });
    });

    // Error Handling Tests
    describe('Error Handling', () => {
      test('should handle AST with no children property', () => {
        const mockAST = {};

        const result = adrToJSON(mockAST);
        expect(result).toEqual({});
      });

      test('should handle null AST', () => {
        const result = adrToJSON({children: null});
        expect(result).toEqual({});
      });

      test('should handle undefined AST', () => {
        const result = adrToJSON({});
        expect(result).toEqual({});
      });

      test('should handle AST with invalid children structure', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'status: open'
            },
            {
              type: 'heading',
              depth: 1,
              children: null
            }
          ]
        };

        const result = adrToJSON(mockAST);
        expect(result.title).toBeUndefined();
      });
    });

    // Real-world Scenarios with Fixture Files
    describe('Real-world Scenarios', () => {
      test('should parse complex ADR from fixture file', async () => {
        const ast = await loadADRFixtureForTest('0001-test-adr-open.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter).toBeDefined();
        expect(result.frontmatter.impact).toBe('high');
        expect(result.frontmatter.status).toBe('open');
        expect(result.frontmatter.tags).toContain('architecture');
        expect(result.title).toBe('API Design Pattern for Data Access');
        expect(result['Problem Description']).toContain('consistent pattern');
      });

      test('should parse committed ADR from fixture file', async () => {
        const ast = await loadADRFixtureForTest('0002-test-adr-committed.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.status).toBe('committed');
        expect(result.frontmatter.impact).toBe('medium');
        expect(result.title).toBe('Container Orchestration Platform');
      });

      test('should parse minimal ADR from fixture file', async () => {
        const ast = await loadADRFixtureForTest('0005-test-adr-minimal.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.status).toBe('open');
        expect(result.title).toBe('Minimal ADR Example');
      });

      test('should handle ADR without frontmatter from fixture file', async () => {
        const ast = await loadADRFixtureForTest('invalid-no-frontmatter.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter).toBeUndefined();
        expect(result.title).toBe('ADR Without Frontmatter');
      });

      test('should handle empty frontmatter from fixture file', async () => {
        const ast = await loadADRFixtureForTest('empty-frontmatter.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter).toBeNull();
        expect(result.title).toBe('ADR with Empty Frontmatter');
      });

      test('should handle malformed YAML from fixture file', async () => {
        const ast = await loadADRFixtureForTest('malformed-yaml.md');

        expect(() => adrToJSON(ast)).toThrow();
      });

      test('should parse complex structure from fixture file', async () => {
        const ast = await loadADRFixtureForTest('complex-structure.md');
        const result = adrToJSON(ast);

        expect(result.frontmatter.tags).toContain('special chars & unicode: 测试');
        expect(result.title).toBe('Complex ADR Structure with Unicode 测试');
        expect(result['Problem Description']).toContain('complex markdown');
      });
    });

    // Integration Tests
    describe('Integration Tests', () => {
      test('should validate complete JSON structure schema', () => {
        const mockAST = {
          children: [
            {
              type: 'yaml',
              value: 'impact: high\nreversibility: medium\nstatus: open\ntags:\n  - test\nreview-by: "2024-01-15"'
            },
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Schema Test ADR' }]
            },
            {
              type: 'heading',
              depth: 2,
              children: [{ type: 'text', value: 'Problem Description' }]
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Problem content.' }]
            }
          ]
        };

        const result = adrToJSON(mockAST);

        expect(result).toHaveProperty('frontmatter');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('Problem Description');
        expect(typeof result.frontmatter).toBe('object');
        expect(typeof result.title).toBe('string');
        expect(typeof result['Problem Description']).toBe('string');
      });
    });
  });
});