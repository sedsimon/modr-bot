import { describe, test, expect } from '@jest/globals';
import { AdrBuilder } from './adrBuilder.js';

describe('AdrBuilder', () => {
  describe('basic builder functionality', () => {
    test('should build ADR with default values', () => {
      const adr = new AdrBuilder().build();

      expect(adr).toHaveProperty('name');
      expect(adr).toHaveProperty('githubUrl');
      expect(adr).toHaveProperty('data');
      expect(adr.data).toHaveProperty('frontmatter');
      expect(adr.data).toHaveProperty('title');
    });

    test('should support fluent API chaining', () => {
      const adr = new AdrBuilder()
        .withTitle('API Design')
        .withStatus('open')
        .withImpact('high')
        .build();

      expect(adr.data.title).toBe('API Design');
      expect(adr.data.frontmatter.status).toBe('open');
      expect(adr.data.frontmatter.impact).toBe('high');
    });

    test('should reset after build', () => {
      const builder = new AdrBuilder();
      const adr1 = builder.withTitle('First').build();
      const adr2 = builder.withTitle('Second').build();

      expect(adr1.data.title).toBe('First');
      expect(adr2.data.title).toBe('Second');
    });
  });

  describe('frontmatter methods', () => {
    test('should set status', () => {
      const adr = new AdrBuilder().withStatus('committed').build();
      expect(adr.data.frontmatter.status).toBe('committed');
    });

    test('should set impact', () => {
      const adr = new AdrBuilder().withImpact('low').build();
      expect(adr.data.frontmatter.impact).toBe('low');
    });

    test('should set tags', () => {
      const adr = new AdrBuilder().withTags(['api', 'database']).build();
      expect(adr.data.frontmatter.tags).toEqual(['api', 'database']);
    });
  });

  describe('content methods', () => {
    test('should set title', () => {
      const adr = new AdrBuilder().withTitle('Custom Title').build();
      expect(adr.data.title).toBe('Custom Title');
    });

    test('should set problem description', () => {
      const adr = new AdrBuilder().withProblemDescription('Custom problem').build();
      expect(adr.data['Problem Description']).toBe('Custom problem');
    });

    test('should set accepted solution', () => {
      const adr = new AdrBuilder().withAcceptedSolution('Custom solution').build();
      expect(adr.data['Accepted Solution']).toBe('Custom solution');
    });
  });

  describe('buildMinimal', () => {
    test('should create minimal ADR with only required fields', () => {
      const adr = new AdrBuilder()
        .withTitle('Minimal ADR')
        .withStatus('open')
        .buildMinimal();

      expect(adr.data.frontmatter).toEqual({ status: 'open' });
      expect(adr.data.title).toBe('Minimal ADR');
      expect(adr.data['Problem Description']).toBeUndefined();
      expect(adr.data['Accepted Solution']).toBeUndefined();
    });
  });
});
