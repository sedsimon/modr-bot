import { TEST_CONFIG } from '../config/testConfig.js';
import { jest } from '@jest/globals';

/**
 * Factory for creating consistent mock data across tests
 */
export class MockFactory {
  
  /**
   * Create a mock GitHub GraphQL response for ADR files
   * @param {Array} adrFiles - Array of ADR file objects to include
   * @returns {Object} Mock GraphQL response
   */
  static createADRFilesResponse(adrFiles = []) {
    const defaultFiles = [
      {
        name: '0001-test-adr-open.md',
        content: this.createADRContent('API Design Pattern', 'open', {
          impact: 'high',
          tags: ['architecture', 'api']
        })
      },
      {
        name: '0002-test-adr-committed.md', 
        content: this.createADRContent('Container Platform', 'committed', {
          impact: 'medium',
          tags: ['infrastructure']
        })
      }
    ];

    const files = adrFiles.length > 0 ? adrFiles : defaultFiles;
    
    return {
      repository: {
        object: {
          entries: files.map(file => ({
            name: file.name,
            object: {
              text: file.content
            }
          }))
        }
      }
    };
  }

  /**
   * Create ADR markdown content
   * @param {string} title - ADR title
   * @param {string} status - ADR status
   * @param {Object} frontmatterOverrides - Additional frontmatter fields
   * @returns {string} Complete ADR markdown content
   */
  static createADRContent(title, status = 'open', frontmatterOverrides = {}) {
    const frontmatter = {
      status,
      impact: 'medium',
      reversibility: 'medium',
      tags: ['test'],
      ...frontmatterOverrides
    };

    const yamlFrontmatter = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return `---
${yamlFrontmatter}
---
# ${title}

## Problem Description
This is a test problem description for ${title}.

## Accepted Solution
This is a test solution for the ${title} decision.

## Trade-offs
Some trade-offs for this decision.`;
  }

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

  /**
   * Create a mock Slack command payload
   * @param {string} commandText - The command text
   * @param {Object} overrides - Additional properties to override
   * @returns {Object} Mock Slack command payload
   */
  static createSlackCommand(commandText = 'log', overrides = {}) {
    return {
      token: 'test-slack-token',
      team_id: TEST_CONFIG.slack.teamId,
      team_domain: 'test-team',
      channel_id: TEST_CONFIG.slack.channelId,
      channel_name: 'general',
      user_id: TEST_CONFIG.slack.userId,
      user_name: 'testuser',
      command: '/adr',
      text: commandText,
      response_url: 'https://hooks.slack.com/commands/test',
      trigger_id: 'test-trigger-id',
      ...overrides
    };
  }

  /**
   * Create a mock Slack button action payload
   * @param {string} actionId - The action ID
   * @param {Object} overrides - Additional properties to override
   * @returns {Object} Mock Slack action payload
   */
  static createSlackButtonAction(actionId = 'view_prs', overrides = {}) {
    return {
      type: 'button',
      action_id: actionId,
      block_id: 'test-block',
      text: {
        type: 'plain_text',
        text: 'View PRs'
      },
      value: 'test-value',
      action_ts: '1234567890.123456',
      ...overrides
    };
  }

  /**
   * Create ADR content without YAML frontmatter for testing parser edge cases
   * @param {string} title - ADR title
   * @param {string} content - Main content body
   * @returns {string} ADR markdown content without frontmatter
   */
  static createADRWithMissingFrontmatter(title = 'Decision Without Frontmatter', content = null) {
    const defaultContent = `This is a test ADR that is missing YAML frontmatter completely.
It should cause parser issues in systems that expect frontmatter.`;

    return `# ${title}

## Problem Description
${content || defaultContent}

## Accepted Solution
This decision has no frontmatter metadata available.

## Trade-offs
Missing metadata makes filtering and categorization difficult.`;
  }

  /**
   * Create ADR content with invalid date formats for testing date parsing
   * @param {string} title - ADR title
   * @param {Object} options - Configuration options
   * @returns {string} ADR markdown content with malformed dates
   */
  static createADRWithInvalidDates(title = 'Decision With Invalid Dates', options = {}) {
    const {
      status = 'open',
      invalidReviewBy = 'not-a-date',
      invalidDecideBy = '2024-13-45', // Invalid month/day
      invalidCommittedOn = '2024/02/30' // Invalid date format
    } = options;

    let frontmatter = `status: ${status}
impact: medium
reversibility: medium
tags:
  - testing
  - dates
review-by: ${invalidReviewBy}
decide-by: ${invalidDecideBy}`;

    if (status === 'committed') {
      frontmatter += `\ncommitted-on: ${invalidCommittedOn}`;
    }

    return `---
${frontmatter}
---
# ${title}

## Problem Description
This ADR contains intentionally malformed dates for testing date parsing robustness.

## Accepted Solution
Use this to test how the system handles invalid date formats.

## Trade-offs
Invalid dates can cause parsing errors or unexpected behavior.`;
  }

  /**
   * Create ADR content with special character tags for testing tag parsing
   * @param {string} title - ADR title
   * @param {Object} options - Configuration options
   * @returns {string} ADR markdown content with special character tags
   */
  static createADRWithSpecialCharTags(title = 'Decision With Special Tags', options = {}) {
    const {
      status = 'open',
      useUnicode = true,
      useSpaces = true,
      useSpecialChars = true
    } = options;

    const tags = [];
    if (useSpaces) tags.push('tag with spaces', 'another spaced tag');
    if (useUnicode) tags.push('测试标签', 'émoji-tag', 'Ñoño-tág');
    if (useSpecialChars) tags.push('tag@special!', 'tag#with$symbols', 'tag-with_underscore');

    // Add some normal tags too
    tags.push('normal', 'regular-tag');

    const yamlTags = tags.map(tag => `  - "${tag}"`).join('\n');

    return `---
status: ${status}
impact: medium
reversibility: medium
tags:
${yamlTags}
---
# ${title}

## Problem Description
This ADR uses tags with special characters to test tag parsing robustness.

## Accepted Solution
Support for unicode, spaces, and special characters in tags.

## Trade-offs
Complex tag names may cause issues in some systems or search functionality.`;
  }

  /**
   * Create ADRs for all possible status values
   * @param {string} baseTitle - Base title to use (will be suffixed with status)
   * @returns {Array} Array of ADR objects with different statuses
   */
  static createADRWithAllStatuses(baseTitle = 'Test Decision') {
    const statuses = TEST_CONFIG.adr.statuses;

    return statuses.map((status, index) => {
      const title = `${baseTitle} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const fileName = `${String(index + 1).padStart(4, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;

      let frontmatterExtras = {};

      // Add status-specific fields
      if (status === 'committed') {
        frontmatterExtras['committed-on'] = '2024-01-15';
        frontmatterExtras['decide-by'] = '2024-01-10';
      } else if (status === 'deferred') {
        frontmatterExtras['review-by'] = '2024-06-01';
        frontmatterExtras['defer-until'] = '2024-12-01';
      } else if (status === 'obsolete') {
        frontmatterExtras['obsoleted-by'] = '0005-replacement-decision.md';
        frontmatterExtras['obsoleted-on'] = '2024-02-01';
      } else {
        frontmatterExtras['review-by'] = '2024-03-15';
        frontmatterExtras['decide-by'] = '2024-04-01';
      }

      return {
        name: fileName,
        content: this.createADRContent(title, status, {
          impact: TEST_CONFIG.adr.impactLevels[index % 3],
          tags: [`status-${status}`, 'testing'],
          ...frontmatterExtras
        })
      };
    });
  }

  /**
   * Create ADRs for all possible impact levels
   * @param {string} baseTitle - Base title to use (will be suffixed with impact)
   * @returns {Array} Array of ADR objects with different impact levels
   */
  static createADRWithAllImpactLevels(baseTitle = 'Impact Test Decision') {
    const impacts = TEST_CONFIG.adr.impactLevels;

    return impacts.map((impact, index) => {
      const title = `${baseTitle} - ${impact.charAt(0).toUpperCase() + impact.slice(1)} Impact`;
      const fileName = `${String(index + 1).padStart(4, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;

      return {
        name: fileName,
        content: this.createADRContent(title, 'open', {
          impact,
          reversibility: TEST_CONFIG.adr.reversibilityLevels[index % 3],
          tags: [`impact-${impact}`, 'testing'],
          'review-by': '2024-03-15',
          'decide-by': '2024-04-01'
        })
      };
    });
  }

  /**
   * Create a diverse dataset of realistic ADR files
   * @param {number} count - Number of ADRs to generate
   * @param {Object} options - Configuration options
   * @returns {Array} Array of varied ADR objects
   */
  static createVariedADRDataset(count = 10, options = {}) {
    const {
      includeInvalid = false,
      titlePrefix = 'Generated Decision'
    } = options;

    const adrs = [];
    const topics = [
      'API Design', 'Database Migration', 'Security Framework', 'Performance Optimization',
      'Infrastructure Change', 'Service Architecture', 'Data Storage', 'Authentication Method',
      'Monitoring Strategy', 'Deployment Process', 'Code Standards', 'Testing Strategy'
    ];

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      const title = `${titlePrefix} ${i + 1}: ${topic}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;

      // Vary the status distribution
      const statusIndex = Math.floor(i / (count / 4));
      const status = TEST_CONFIG.adr.statuses[Math.min(statusIndex, TEST_CONFIG.adr.statuses.length - 1)];

      // Vary impact and reversibility
      const impact = TEST_CONFIG.adr.impactLevels[i % 3];
      const reversibility = TEST_CONFIG.adr.reversibilityLevels[(i + 1) % 3];

      // Vary tags
      const tagCombination = TEST_CONFIG.adr.tagCombinations[i % TEST_CONFIG.adr.tagCombinations.length];

      // Add some date variations
      const dates = this._generateDateVariations(i);

      const frontmatterOverrides = {
        impact,
        reversibility,
        tags: [...tagCombination, `generated-${i + 1}`],
        ...dates
      };

      // Occasionally add invalid content if requested
      if (includeInvalid && i % 5 === 0) {
        if (i % 10 === 0) {
          // Missing frontmatter
          adrs.push({
            name: fileName,
            content: this.createADRWithMissingFrontmatter(title)
          });
        } else {
          // Invalid dates
          adrs.push({
            name: fileName,
            content: this.createADRWithInvalidDates(title, { status })
          });
        }
      } else {
        adrs.push({
          name: fileName,
          content: this.createADRContent(title, status, frontmatterOverrides)
        });
      }
    }

    return adrs;
  }

  /**
   * Create ADR content with various date formats and edge cases
   * @param {string} title - ADR title
   * @param {Object} options - Configuration options
   * @returns {string} ADR markdown content with date variations
   */
  static createADRWithDateVariations(title = 'Decision With Date Variations', options = {}) {
    const {
      status = 'open',
      dateFormat = 'iso', // 'iso', 'us', 'eu', 'mixed'
      includeTime = false,
      includeInvalid = false
    } = options;

    let reviewBy, decideBy, committedOn;

    if (includeInvalid) {
      reviewBy = 'invalid-date';
      decideBy = '2024-13-45';
      committedOn = '30/02/2024';
    } else {
      switch (dateFormat) {
        case 'us':
          reviewBy = '03/15/2024';
          decideBy = '04/01/2024';
          committedOn = '01/15/2024';
          break;
        case 'eu':
          reviewBy = '15/03/2024';
          decideBy = '01/04/2024';
          committedOn = '15/01/2024';
          break;
        case 'mixed':
          reviewBy = '2024-03-15';  // ISO
          decideBy = '04/01/2024';  // US
          committedOn = '15/01/2024'; // EU
          break;
        default: // iso
          reviewBy = '2024-03-15';
          decideBy = '2024-04-01';
          committedOn = '2024-01-15';
      }

      if (includeTime) {
        reviewBy += 'T10:00:00Z';
        decideBy += 'T17:30:00Z';
        committedOn += 'T14:15:30Z';
      }
    }

    let frontmatter = `status: ${status}
impact: medium
reversibility: medium
tags:
  - date-testing
  - ${dateFormat}-format
review-by: "${reviewBy}"
decide-by: "${decideBy}"`;

    if (status === 'committed') {
      frontmatter += `\ncommitted-on: "${committedOn}"`;
    }

    return `---
${frontmatter}
---
# ${title}

## Problem Description
This ADR tests various date formats and edge cases in date parsing.

## Accepted Solution
Support multiple date formats while handling edge cases gracefully.

## Trade-offs
Complex date parsing may introduce bugs or inconsistencies.`;
  }

  /**
   * Create ADR content with various tag combinations and formats
   * @param {string} title - ADR title
   * @param {Object} options - Configuration options
   * @returns {string} ADR markdown content with tag variations
   */
  static createADRWithTagVariations(title = 'Decision With Tag Variations', options = {}) {
    const {
      status = 'open',
      tagStyle = 'mixed', // 'simple', 'complex', 'mixed'
      includeEmpty = false,
      includeDuplicates = false
    } = options;

    let tags = [];

    switch (tagStyle) {
      case 'simple':
        tags = ['api', 'backend', 'database'];
        break;
      case 'complex':
        tags = [
          'complex-tag-with-dashes',
          'tag_with_underscores',
          'TagWithCamelCase',
          'tag.with.dots',
          'tag with spaces',
          'UPPERCASE_TAG'
        ];
        break;
      default: // mixed
        tags = [
          'simple',
          'complex-tag',
          'tag_underscore',
          'CamelCaseTag',
          'tag with space',
          'special@chars!',
          'unicode-测试',
          'number123'
        ];
    }

    if (includeEmpty) {
      tags.push('', '   '); // Empty and whitespace-only tags
    }

    if (includeDuplicates) {
      tags.push('simple', 'simple'); // Duplicate tags
    }

    const yamlTags = tags.map(tag => `  - "${tag}"`).join('\n');

    return `---
status: ${status}
impact: medium
reversibility: medium
tags:
${yamlTags}
---
# ${title}

## Problem Description
This ADR tests various tag formats and edge cases in tag parsing.

## Accepted Solution
Support diverse tag formats while handling edge cases appropriately.

## Trade-offs
Complex tag parsing may affect search and filtering functionality.`;
  }

  /**
   * Helper method to generate varied dates for dataset creation
   * @param {number} index - Index for variation
   * @returns {Object} Date fields for frontmatter
   * @private
   */
  static _generateDateVariations(index) {
    const baseDate = new Date('2024-01-01');
    const reviewDays = 30 + (index * 7) % 90; // 30-120 days
    const decideDays = reviewDays + 14 + (index * 3) % 21; // +14-35 days after review

    const reviewBy = new Date(baseDate);
    reviewBy.setDate(baseDate.getDate() + reviewDays);

    const decideBy = new Date(baseDate);
    decideBy.setDate(baseDate.getDate() + decideDays);

    return {
      'review-by': reviewBy.toISOString().split('T')[0],
      'decide-by': decideBy.toISOString().split('T')[0]
    };
  }

  /**
   * Create a mock Octokit instance with predefined responses
   * @param {Object} responses - Object containing mock responses for different methods
   * @returns {Object} Mock Octokit instance
   */
  static createMockOctokit(responses = {}) {
    const defaultResponses = {
      graphql: this.createADRFilesResponse(),
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