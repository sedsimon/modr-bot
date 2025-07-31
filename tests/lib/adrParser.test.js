import { describe, test, expect } from '@jest/globals';
import { adrToJSON } from '../../lib/adrParser.js';

describe('adrParser', () => {
  describe('adrToJSON', () => {
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

      // This should handle empty children arrays gracefully without throwing
      expect(() => adrToJSON(mockAST)).not.toThrow();
    });
  });
});