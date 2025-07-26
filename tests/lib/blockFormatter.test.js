import { describe, test, expect } from '@jest/globals';
import { toBlockFormat } from '../../lib/blockFormatter.js';

describe('blockFormatter', () => {
  describe('toBlockFormat', () => {
    test('should return basic block structure with divider', () => {
      const adrFile = {
        name: 'test-adr.md',
        githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
        data: {}
      };

      const result = toBlockFormat(adrFile);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toEqual({
        type: "divider"
      });
    });

    test('should format ADR title with GitHub link and List PRs button', () => {
      const adrFile = {
        name: '0001-api-design.md',
        githubUrl: 'https://github.com/test/repo/blob/main/0001-api-design.md',
        data: {
          title: 'API Design Pattern for Data Access'
        }
      };

      const result = toBlockFormat(adrFile);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Problem:* <https://github.com/test/repo/blob/main/0001-api-design.md|API Design Pattern for Data Access>",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "List PRs",
          },
          value: '0001-api-design.md',
          action_id: "list prs action"
        }
      });
    });

    test('should format Problem Description section', () => {
      const adrFile = {
        name: 'test-adr.md',
        githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
        data: {
          'Problem Description': 'We need to establish a consistent pattern for accessing data across our microservices architecture.'
        }
      };

      const result = toBlockFormat(adrFile);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: 'We need to establish a consistent pattern for accessing data across our microservices architecture.',
        },
      });
    });

    test('should format Accepted Solution section with header and content', () => {
      const adrFile = {
        name: 'test-adr.md',
        githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
        data: {
          'Accepted Solution': 'Implement a standardized GraphQL API gateway pattern with service-specific resolvers.'
        }
      };

      const result = toBlockFormat(adrFile);

      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Accepted Solution*",
        },
      });
      expect(result[2]).toEqual({
        type: "section",
        text: {
          type: "mrkdwn",
          text: 'Implement a standardized GraphQL API gateway pattern with service-specific resolvers.',
        },
      });
    });

    test('should format complete ADR with all sections', () => {
      const adrFile = {
        name: '0001-api-design.md',
        githubUrl: 'https://github.com/test/repo/blob/main/0001-api-design.md',
        data: {
          title: 'API Design Pattern for Data Access',
          'Problem Description': 'We need to establish a consistent pattern for accessing data.',
          'Accepted Solution': 'Implement a standardized GraphQL API gateway pattern.'
        }
      };

      const result = toBlockFormat(adrFile);

      expect(result).toHaveLength(5);
      expect(result[0].type).toBe("divider");
      expect(result[1].text.text).toContain("API Design Pattern for Data Access");
      expect(result[2].text.text).toBe('We need to establish a consistent pattern for accessing data.');
      expect(result[3].text.text).toBe("*Accepted Solution*");
      expect(result[4].text.text).toBe('Implement a standardized GraphQL API gateway pattern.');
    });

    describe('frontmatter context blocks', () => {
      test('should format status in context block', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              status: 'open'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "`Status: open`",
            }
          ]
        });
      });

      test('should format multiple frontmatter properties', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              status: 'committed',
              impact: 'high',
              'decide-by': '2024-02-01',
              'review-by': '2024-01-15'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[1].type).toBe("context");
        expect(result[1].elements).toHaveLength(4);
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Status: committed`",
        });
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Impact: high`",
        });
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Decide By: 2024-02-01`",
        });
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Review By: 2024-01-15`",
        });
      });

      test('should format committed-on property when status is also present', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              status: 'committed',
              'committed-on': '2024-01-20'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Committed On: 2024-01-20`",
        });
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Status: committed`",
        });
      });

      test('should handle legacy committed property', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              committed: 'true'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        // The committed property triggers context block creation but has no label mapping
        // so it creates an empty context block
        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({
          type: "context",
          elements: []
        });
      });

      test('should format impact when status is also present', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              status: 'open',
              impact: 'high'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Status: open`",
        });
        expect(result[1].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Impact: high`",
        });
      });

      test('should not create context block when no relevant frontmatter exists', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {
              tags: ['api', 'architecture'],
              reversibility: 'medium'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("divider");
      });

      test('should not create context block when frontmatter is empty', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            frontmatter: {}
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("divider");
      });
    });

    describe('edge cases', () => {
      test('should handle missing title gracefully', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            'Problem Description': 'A problem without a title.'
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe("divider");
        expect(result[1].text.text).toBe('A problem without a title.');
      });

      test('should handle empty ADR data', () => {
        const adrFile = {
          name: 'empty-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/empty-adr.md',
          data: {}
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          type: "divider"
        });
      });

      test('should handle ADR with only title', () => {
        const adrFile = {
          name: 'title-only.md',
          githubUrl: 'https://github.com/test/repo/blob/main/title-only.md',
          data: {
            title: 'Title Only ADR'
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(2);
        expect(result[1].text.text).toContain('Title Only ADR');
        expect(result[1].accessory.value).toBe('title-only.md');
      });

      test('should handle special characters in title and content', () => {
        const adrFile = {
          name: 'special-chars.md',
          githubUrl: 'https://github.com/test/repo/blob/main/special-chars.md',
          data: {
            title: 'Decision with "quotes" & symbols',
            'Problem Description': 'Problem with *markdown* and `code` formatting'
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(3);
        expect(result[1].text.text).toContain('Decision with "quotes" & symbols');
        expect(result[2].text.text).toBe('Problem with *markdown* and `code` formatting');
      });
    });

    describe('Slack Block Kit compliance', () => {
      test('should generate valid Slack block structure', () => {
        const adrFile = {
          name: 'test-adr.md',
          githubUrl: 'https://github.com/test/repo/blob/main/test-adr.md',
          data: {
            title: 'Test ADR',
            'Problem Description': 'Test problem',
            'Accepted Solution': 'Test solution',
            frontmatter: {
              status: 'open',
              impact: 'high'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        // Verify overall structure
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);

        // Verify each block has required properties
        result.forEach(block => {
          expect(block).toHaveProperty('type');
          expect(typeof block.type).toBe('string');

          if (block.type === 'section') {
            expect(block).toHaveProperty('text');
            expect(block.text).toHaveProperty('type');
            expect(block.text).toHaveProperty('text');
            expect(block.text.type).toBe('mrkdwn');
          }

          if (block.type === 'context') {
            expect(block).toHaveProperty('elements');
            expect(block.elements).toBeInstanceOf(Array);
            block.elements.forEach(element => {
              expect(element).toHaveProperty('type', 'mrkdwn');
              expect(element).toHaveProperty('text');
            });
          }
        });
      });

      test('should handle long content appropriately', () => {
        const longContent = 'A'.repeat(3000); // Slack has text limits
        const adrFile = {
          name: 'long-content.md',
          githubUrl: 'https://github.com/test/repo/blob/main/long-content.md',
          data: {
            title: 'ADR with Long Content',
            'Problem Description': longContent
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(3);
        expect(result[2].text.text).toBe(longContent);
      });
    });

    describe('real-world scenarios', () => {
      test('should format ADR from fixture data - open status', () => {
        const adrFile = {
          name: '0001-test-adr-open.md',
          githubUrl: 'https://github.com/test/repo/blob/main/0001-test-adr-open.md',
          data: {
            title: 'API Design Pattern for Data Access',
            'Problem Description': 'We need to establish a consistent pattern for accessing data across our microservices architecture. Currently, different teams are implementing different approaches, leading to inconsistencies and maintenance challenges.',
            'Accepted Solution': 'Implement a standardized GraphQL API gateway pattern with service-specific resolvers.',
            frontmatter: {
              impact: 'high',
              reversibility: 'medium',
              status: 'open',
              'review-by': '2024-01-15',
              'decide-by': '2024-02-01'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(6);
        expect(result[0].type).toBe('divider');
        expect(result[1].text.text).toContain('API Design Pattern for Data Access');
        expect(result[2].text.text).toContain('microservices architecture');
        expect(result[3].text.text).toBe('*Accepted Solution*');
        expect(result[4].text.text).toContain('GraphQL API gateway');
        expect(result[5].type).toBe('context');
        expect(result[5].elements).toHaveLength(4);
      });

      test('should format ADR from fixture data - committed status', () => {
        const adrFile = {
          name: '0002-test-adr-committed.md',
          githubUrl: 'https://github.com/test/repo/blob/main/0002-test-adr-committed.md',
          data: {
            title: 'Container Orchestration Platform',
            'Problem Description': 'Our current deployment process is manual and error-prone. We need an automated container orchestration solution to improve reliability and scalability.',
            'Accepted Solution': 'Adopt Kubernetes as our container orchestration platform with Helm for package management.',
            frontmatter: {
              impact: 'medium',
              reversibility: 'low',
              status: 'committed',
              'decide-by': '2023-12-01'
            }
          }
        };

        const result = toBlockFormat(adrFile);

        expect(result).toHaveLength(6);
        expect(result[1].text.text).toContain('Container Orchestration Platform');
        expect(result[5].elements).toHaveLength(3);
        expect(result[5].elements).toContainEqual({
          type: "mrkdwn",
          text: "`Status: committed`",
        });
      });
    });
  });
});