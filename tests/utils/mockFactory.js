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

  // ====================================================================
  // SPECIALIZED FILTER TESTING METHODS FOR checkFilter() COMPREHENSIVE TESTING
  // ====================================================================

  /**
   * Create ADRs specifically for status filtering test scenarios
   * Includes all possible status values with predictable combinations
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for status filter testing
   */
  static createStatusFilterTestData(options = {}) {
    const { includeEdgeCases = true, baseDate = '2024-01-01' } = options;
    const statuses = TEST_CONFIG.adr.statuses;
    const adrs = [];

    statuses.forEach((status, index) => {
      const title = `Status Filter Test - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const fileName = `${String(index + 1).padStart(4, '0')}-status-filter-${status}.md`;

      let frontmatterExtras = {
        impact: TEST_CONFIG.adr.impactLevels[index % 3],
        tags: [`status-${status}`, 'filter-test']
      };

      // Add status-specific date fields
      if (status === 'committed') {
        frontmatterExtras['committed-on'] = baseDate;
        frontmatterExtras['decide-by'] = '2023-12-15';
      } else if (status === 'open') {
        frontmatterExtras['review-by'] = '2024-03-15';
        frontmatterExtras['decide-by'] = '2024-04-01';
      } else if (status === 'deferred') {
        frontmatterExtras['defer-until'] = '2024-12-01';
        frontmatterExtras['review-by'] = '2024-06-01';
      } else if (status === 'obsolete') {
        frontmatterExtras['obsoleted-by'] = '0099-replacement-decision.md';
        frontmatterExtras['obsoleted-on'] = '2024-02-01';
      }

      adrs.push({
        name: fileName,
        content: this.createADRContent(title, status, frontmatterExtras)
      });
    });

    // Add edge cases if requested
    if (includeEdgeCases) {
      // ADR with invalid status (for robustness testing)
      adrs.push({
        name: '0099-invalid-status.md',
        content: this.createADRContent('Invalid Status Test', 'invalid-status', {
          impact: 'medium',
          tags: ['edge-case', 'invalid']
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs with mixed status combinations for multi-filter scenarios
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects with varied status combinations
   */
  static createMixedStatusADRs(options = {}) {
    const { count = 8, statusDistribution = null } = options;
    const statuses = statusDistribution || ['open', 'open', 'committed', 'committed', 'deferred', 'obsolete', 'open', 'committed'];
    const adrs = [];

    for (let i = 0; i < Math.min(count, statuses.length); i++) {
      const status = statuses[i];
      const title = `Mixed Status ADR ${i + 1} - ${status}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-mixed-status-${i + 1}.md`;

      let frontmatterExtras = {
        impact: TEST_CONFIG.adr.impactLevels[i % 3],
        tags: [`mixed-${i + 1}`, `status-${status}`]
      };

      // Add appropriate date fields based on status
      if (status === 'committed') {
        frontmatterExtras['committed-on'] = '2024-01-15';
      } else if (status === 'open') {
        frontmatterExtras['decide-by'] = '2024-04-01';
      }

      adrs.push({
        name: fileName,
        content: this.createADRContent(title, status, frontmatterExtras)
      });
    }

    return adrs;
  }

  /**
   * Create ADRs specifically for tag filtering test scenarios
   * Tests various tag combinations and intersection logic
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for tag filter testing
   */
  static createTagFilterTestData(options = {}) {
    const { includeEdgeCases = true } = options;
    const adrs = [];

    // Single tag scenarios
    const singleTagScenarios = [
      { tags: ['architecture'], title: 'Single Tag - Architecture' },
      { tags: ['api'], title: 'Single Tag - API' },
      { tags: ['database'], title: 'Single Tag - Database' },
      { tags: ['security'], title: 'Single Tag - Security' }
    ];

    singleTagScenarios.forEach((scenario, index) => {
      const fileName = `${String(index + 1).padStart(4, '0')}-single-tag-${scenario.tags[0]}.md`;
      adrs.push({
        name: fileName,
        content: this.createADRContent(scenario.title, 'open', {
          tags: scenario.tags,
          impact: 'medium'
        })
      });
    });

    // Multi-tag scenarios
    const multiTagScenarios = [
      { tags: ['architecture', 'api'], title: 'Multi Tag - Architecture + API' },
      { tags: ['database', 'performance'], title: 'Multi Tag - Database + Performance' },
      { tags: ['security', 'compliance', 'audit'], title: 'Multi Tag - Security + Compliance + Audit' },
      { tags: ['infrastructure', 'deployment', 'monitoring'], title: 'Multi Tag - Infrastructure + Deployment + Monitoring' }
    ];

    multiTagScenarios.forEach((scenario, index) => {
      const fileName = `${String(index + 5).padStart(4, '0')}-multi-tag-${index + 1}.md`;
      adrs.push({
        name: fileName,
        content: this.createADRContent(scenario.title, 'open', {
          tags: scenario.tags,
          impact: 'high'
        })
      });
    });

    // Overlapping tags scenarios
    const overlappingScenarios = [
      { tags: ['api', 'common'], title: 'Overlapping - API + Common' },
      { tags: ['database', 'common'], title: 'Overlapping - Database + Common' },
      { tags: ['security', 'common', 'shared'], title: 'Overlapping - Security + Common + Shared' },
      { tags: ['performance', 'shared'], title: 'Overlapping - Performance + Shared' }
    ];

    overlappingScenarios.forEach((scenario, index) => {
      const fileName = `${String(index + 9).padStart(4, '0')}-overlapping-${index + 1}.md`;
      adrs.push({
        name: fileName,
        content: this.createADRContent(scenario.title, 'open', {
          tags: scenario.tags,
          impact: 'low'
        })
      });
    });

    if (includeEdgeCases) {
      // Empty tags array
      adrs.push({
        name: '0099-empty-tags.md',
        content: this.createADRContent('Empty Tags Test', 'open', {
          tags: [],
          impact: 'medium'
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs with single tags for specific tag testing
   * @param {Array} tags - Array of single tags to create ADRs for
   * @returns {Array} Array of ADR objects, each with a single tag
   */
  static createSingleTagADRs(tags = ['architecture', 'api', 'database', 'security']) {
    return tags.map((tag, index) => {
      const title = `Single Tag Test - ${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
      const fileName = `${String(index + 1).padStart(4, '0')}-single-${tag}.md`;

      return {
        name: fileName,
        content: this.createADRContent(title, 'open', {
          tags: [tag],
          impact: TEST_CONFIG.adr.impactLevels[index % 3]
        })
      };
    });
  }

  /**
   * Create ADRs with multiple tags for complex tag testing
   * @param {Array} tagCombinations - Array of tag arrays
   * @returns {Array} Array of ADR objects with multiple tags
   */
  static createMultiTagADRs(tagCombinations = [
    ['api', 'architecture'],
    ['database', 'performance', 'optimization'],
    ['security', 'compliance'],
    ['infrastructure', 'deployment', 'monitoring', 'ops']
  ]) {
    return tagCombinations.map((tags, index) => {
      const title = `Multi Tag Test - ${tags.join(' + ')}`;
      const fileName = `${String(index + 1).padStart(4, '0')}-multi-${index + 1}.md`;

      return {
        name: fileName,
        content: this.createADRContent(title, 'committed', {
          tags,
          impact: TEST_CONFIG.adr.impactLevels[index % 3],
          'committed-on': '2024-01-15'
        })
      };
    });
  }

  /**
   * Create ADRs with overlapping tags for intersection testing
   * @param {Array} commonTags - Common tags to appear across multiple ADRs
   * @returns {Array} Array of ADR objects sharing common tags
   */
  static createOverlappingTagsADRs(commonTags = ['common', 'shared']) {
    const scenarios = [
      { tags: [...commonTags, 'api'], title: 'Overlapping - API' },
      { tags: [...commonTags, 'database'], title: 'Overlapping - Database' },
      { tags: [commonTags[0], 'security'], title: 'Overlapping - Security (partial)' },
      { tags: [...commonTags, 'performance', 'monitoring'], title: 'Overlapping - Performance' }
    ];

    return scenarios.map((scenario, index) => {
      const fileName = `${String(index + 1).padStart(4, '0')}-overlapping-${index + 1}.md`;

      return {
        name: fileName,
        content: this.createADRContent(scenario.title, 'open', {
          tags: scenario.tags,
          impact: TEST_CONFIG.adr.impactLevels[index % 3]
        })
      };
    });
  }

  /**
   * Create ADRs specifically for impact level filtering test scenarios
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for impact filter testing
   */
  static createImpactFilterTestData(options = {}) {
    const { includeMultiple = true } = options;
    const impacts = TEST_CONFIG.adr.impactLevels;
    const adrs = [];

    impacts.forEach((impact, index) => {
      const title = `Impact Filter Test - ${impact.charAt(0).toUpperCase() + impact.slice(1)}`;
      const fileName = `${String(index + 1).padStart(4, '0')}-impact-${impact}.md`;

      adrs.push({
        name: fileName,
        content: this.createADRContent(title, 'open', {
          impact,
          tags: [`impact-${impact}`, 'filter-test'],
          reversibility: TEST_CONFIG.adr.reversibilityLevels[index % 3]
        })
      });
    });

    if (includeMultiple) {
      // Add multiple ADRs for each impact level
      impacts.forEach((impact, impactIndex) => {
        for (let i = 0; i < 2; i++) {
          const title = `Multiple Impact Test - ${impact} ${i + 1}`;
          const fileName = `${String(impactIndex * 2 + i + 10).padStart(4, '0')}-multi-impact-${impact}-${i + 1}.md`;

          adrs.push({
            name: fileName,
            content: this.createADRContent(title, i === 0 ? 'open' : 'committed', {
              impact,
              tags: [`multi-impact-${impact}`, `series-${i + 1}`],
              'committed-on': i === 1 ? '2024-01-15' : undefined
            })
          });
        }
      });
    }

    return adrs;
  }

  /**
   * Create ADRs with mixed impact levels for multi-impact filtering
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects with varied impact levels
   */
  static createMixedImpactADRs(options = {}) {
    const { count = 9, impactDistribution = null } = options;
    const impacts = impactDistribution || ['high', 'high', 'medium', 'medium', 'medium', 'low', 'low', 'high', 'medium'];
    const adrs = [];

    for (let i = 0; i < Math.min(count, impacts.length); i++) {
      const impact = impacts[i];
      const title = `Mixed Impact ADR ${i + 1} - ${impact}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-mixed-impact-${i + 1}.md`;

      adrs.push({
        name: fileName,
        content: this.createADRContent(title, 'open', {
          impact,
          tags: [`mixed-${i + 1}`, `impact-${impact}`],
          reversibility: TEST_CONFIG.adr.reversibilityLevels[i % 3]
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs specifically for date-based filtering test scenarios
   * Tests committedAfter and decideBefore filtering logic
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for date filter testing
   */
  static createDateFilterTestData(options = {}) {
    const { baseDate = '2024-01-15', includeInvalidDates = true } = options;
    const adrs = [];
    const baseDateObj = new Date(baseDate);

    // Create committed ADRs with various committed-on dates
    const committedDates = [
      { date: '2024-01-01', title: 'Early Committed ADR', fileName: '0001-early-committed.md' },
      { date: baseDate, title: 'Base Date Committed ADR', fileName: '0002-base-committed.md' },
      { date: '2024-02-01', title: 'Later Committed ADR', fileName: '0003-later-committed.md' },
      { date: '2023-12-15', title: 'Previous Year Committed ADR', fileName: '0004-prev-year-committed.md' }
    ];

    committedDates.forEach((scenario) => {
      adrs.push({
        name: scenario.fileName,
        content: this.createADRContent(scenario.title, 'committed', {
          'committed-on': scenario.date,
          'decide-by': '2023-12-01',
          impact: 'medium',
          tags: ['date-test', 'committed']
        })
      });
    });

    // Create open ADRs with various decide-by dates (for decideBefore testing)
    const openDecisionDates = [
      { date: '2024-03-01', title: 'Early Decision ADR', fileName: '0005-early-decision.md' },
      { date: '2024-04-15', title: 'Mid Decision ADR', fileName: '0006-mid-decision.md' },
      { date: '2024-06-01', title: 'Late Decision ADR', fileName: '0007-late-decision.md' },
      { date: '2023-12-31', title: 'Past Due Decision ADR', fileName: '0008-past-due.md' }
    ];

    openDecisionDates.forEach((scenario) => {
      adrs.push({
        name: scenario.fileName,
        content: this.createADRContent(scenario.title, 'open', {
          'decide-by': scenario.date,
          'review-by': '2024-02-15',
          impact: 'high',
          tags: ['date-test', 'open']
        })
      });
    });

    if (includeInvalidDates) {
      // ADRs with invalid dates for testing NaN handling
      adrs.push({
        name: '0099-invalid-committed-date.md',
        content: this.createADRContent('Invalid Committed Date ADR', 'committed', {
          'committed-on': 'not-a-date',
          'decide-by': '2024-01-01',
          impact: 'low',
          tags: ['date-test', 'invalid']
        })
      });

      adrs.push({
        name: '0098-invalid-decision-date.md',
        content: this.createADRContent('Invalid Decision Date ADR', 'open', {
          'decide-by': '2024-13-45', // Invalid month/day
          'review-by': '2024-02-15',
          impact: 'low',
          tags: ['date-test', 'invalid']
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs specifically for committedAfter filter testing
   * @param {string|Date} baseDate - Base date for comparison
   * @param {Object} options - Configuration options
   * @returns {Array} Array of committed ADR objects for committedAfter testing
   */
  static createCommittedAfterTestData(baseDate, options = {}) {
    const { includeEdgeCases = true } = options;
    const baseDateObj = new Date(baseDate);
    const adrs = [];

    // Create ADRs committed before, on, and after the base date
    const scenarios = [
      {
        date: new Date(baseDateObj.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
        title: 'Committed Before Base',
        fileName: '0001-committed-before.md'
      },
      {
        date: baseDateObj, // Same date
        title: 'Committed On Base Date',
        fileName: '0002-committed-on-base.md'
      },
      {
        date: new Date(baseDateObj.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
        title: 'Committed After Base',
        fileName: '0003-committed-after.md'
      },
      {
        date: new Date(baseDateObj.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after
        title: 'Committed Much Later',
        fileName: '0004-committed-much-later.md'
      }
    ];

    scenarios.forEach((scenario, index) => {
      adrs.push({
        name: scenario.fileName,
        content: this.createADRContent(scenario.title, 'committed', {
          'committed-on': scenario.date.toISOString().split('T')[0],
          'decide-by': '2023-12-01',
          impact: TEST_CONFIG.adr.impactLevels[index % 3],
          tags: ['committed-after-test', `scenario-${index + 1}`]
        })
      });
    });

    if (includeEdgeCases) {
      // ADR with missing committed-on date
      adrs.push({
        name: '0099-missing-committed-date.md',
        content: this.createADRContent('Missing Committed Date', 'committed', {
          'decide-by': '2024-01-01',
          impact: 'medium',
          tags: ['committed-after-test', 'edge-case']
        })
      });

      // ADR with invalid committed-on date
      adrs.push({
        name: '0098-invalid-committed-date.md',
        content: this.createADRContent('Invalid Committed Date', 'committed', {
          'committed-on': 'invalid-date-format',
          'decide-by': '2024-01-01',
          impact: 'medium',
          tags: ['committed-after-test', 'edge-case', 'invalid']
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs specifically for decideBefore filter testing
   * Only creates open ADRs (requirement for decideBefore filter)
   * @param {string|Date} baseDate - Base date for comparison
   * @param {Object} options - Configuration options
   * @returns {Array} Array of open ADR objects for decideBefore testing
   */
  static createDecideBeforeTestData(baseDate, options = {}) {
    const { includeEdgeCases = true } = options;
    const baseDateObj = new Date(baseDate);
    const adrs = [];

    // Create open ADRs with decide-by dates before, on, and after the base date
    const scenarios = [
      {
        date: new Date(baseDateObj.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days before
        title: 'Decision Due Before Base',
        fileName: '0001-decide-before.md'
      },
      {
        date: baseDateObj, // Same date
        title: 'Decision Due On Base Date',
        fileName: '0002-decide-on-base.md'
      },
      {
        date: new Date(baseDateObj.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
        title: 'Decision Due After Base',
        fileName: '0003-decide-after.md'
      },
      {
        date: new Date(baseDateObj.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
        title: 'Decision Long Overdue',
        fileName: '0004-decide-overdue.md'
      }
    ];

    scenarios.forEach((scenario, index) => {
      adrs.push({
        name: scenario.fileName,
        content: this.createADRContent(scenario.title, 'open', {
          'decide-by': scenario.date.toISOString().split('T')[0],
          'review-by': '2024-01-15',
          impact: TEST_CONFIG.adr.impactLevels[index % 3],
          tags: ['decide-before-test', `scenario-${index + 1}`]
        })
      });
    });

    // Also create non-open ADRs to test status requirement
    const nonOpenStatuses = ['committed', 'deferred', 'obsolete'];
    nonOpenStatuses.forEach((status, index) => {
      const beforeDate = new Date(baseDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
      adrs.push({
        name: `00${index + 10}-${status}-with-early-decide.md`,
        content: this.createADRContent(`${status} ADR with Early Decide Date`, status, {
          'decide-by': beforeDate.toISOString().split('T')[0],
          'committed-on': status === 'committed' ? '2024-02-01' : undefined,
          impact: 'medium',
          tags: ['decide-before-test', `status-${status}`]
        })
      });
    });

    if (includeEdgeCases) {
      // Open ADR with missing decide-by date
      adrs.push({
        name: '0099-missing-decide-date.md',
        content: this.createADRContent('Missing Decide Date', 'open', {
          'review-by': '2024-01-15',
          impact: 'medium',
          tags: ['decide-before-test', 'edge-case']
        })
      });

      // Open ADR with invalid decide-by date
      adrs.push({
        name: '0098-invalid-decide-date.md',
        content: this.createADRContent('Invalid Decide Date', 'open', {
          'decide-by': 'not-a-valid-date',
          'review-by': '2024-01-15',
          impact: 'medium',
          tags: ['decide-before-test', 'edge-case', 'invalid']
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs with various date edge cases for comprehensive date testing
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects with date edge cases
   */
  static createDateEdgeCaseADRs(options = {}) {
    const { includeTimestamps = false, includeBoundaryDates = true } = options;
    const adrs = [];

    const edgeCases = [
      {
        title: 'Leap Year Date',
        fileName: '0001-leap-year.md',
        status: 'committed',
        dates: { 'committed-on': '2024-02-29', 'decide-by': '2024-02-28' }
      },
      {
        title: 'Year Boundary',
        fileName: '0002-year-boundary.md',
        status: 'open',
        dates: { 'decide-by': '2024-12-31', 'review-by': '2024-12-15' }
      },
      {
        title: 'Month Boundary',
        fileName: '0003-month-boundary.md',
        status: 'committed',
        dates: { 'committed-on': '2024-01-31', 'decide-by': '2024-01-30' }
      }
    ];

    if (includeTimestamps) {
      edgeCases.push({
        title: 'Date with Timestamp',
        fileName: '0004-with-timestamp.md',
        status: 'committed',
        dates: { 'committed-on': '2024-01-15T14:30:00Z', 'decide-by': '2024-01-10T09:00:00Z' }
      });
    }

    if (includeBoundaryDates) {
      edgeCases.push(
        {
          title: 'Same Commit and Decide Date',
          fileName: '0005-same-dates.md',
          status: 'committed',
          dates: { 'committed-on': '2024-01-15', 'decide-by': '2024-01-15' }
        },
        {
          title: 'Commit Before Decide',
          fileName: '0006-commit-before-decide.md',
          status: 'committed',
          dates: { 'committed-on': '2024-01-10', 'decide-by': '2024-01-15' }
        }
      );
    }

    edgeCases.forEach((testCase, index) => {
      adrs.push({
        name: testCase.fileName,
        content: this.createADRContent(testCase.title, testCase.status, {
          ...testCase.dates,
          impact: TEST_CONFIG.adr.impactLevels[index % 3],
          tags: ['date-edge-case', `case-${index + 1}`]
        })
      });
    });

    return adrs;
  }

  /**
   * Create ADRs for testing combined/multiple filter scenarios
   * Tests complex filter combinations that use multiple criteria simultaneously
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for combined filter testing
   */
  static createCombinedFilterTestData(options = {}) {
    const { baseDate = '2024-01-15', includeNoMatches = true } = options;
    const adrs = [];
    const baseDateObj = new Date(baseDate);

    // Scenario 1: status + impact combination
    const statusImpactCombos = [
      { status: 'open', impact: 'high', tags: ['architecture', 'critical'], title: 'Open High Impact Architecture' },
      { status: 'committed', impact: 'medium', tags: ['api', 'integration'], title: 'Committed Medium Impact API' },
      { status: 'deferred', impact: 'low', tags: ['performance', 'optimization'], title: 'Deferred Low Impact Performance' }
    ];

    statusImpactCombos.forEach((combo, index) => {
      const fileName = `${String(index + 1).padStart(4, '0')}-status-impact-${combo.status}-${combo.impact}.md`;
      const extras = {
        impact: combo.impact,
        tags: combo.tags
      };

      if (combo.status === 'committed') {
        extras['committed-on'] = baseDate;
        extras['decide-by'] = '2023-12-15';
      } else if (combo.status === 'open') {
        extras['decide-by'] = '2024-04-01';
      }

      adrs.push({
        name: fileName,
        content: this.createADRContent(combo.title, combo.status, extras)
      });
    });

    // Scenario 2: status + tags + impact combination
    const tripleFilters = [
      {
        status: 'open',
        impact: 'high',
        tags: ['security', 'compliance'],
        title: 'High Impact Open Security Decision',
        fileName: '0010-triple-open-high-security.md'
      },
      {
        status: 'committed',
        impact: 'medium',
        tags: ['database', 'migration'],
        title: 'Medium Impact Committed Database Decision',
        fileName: '0011-triple-committed-medium-database.md'
      }
    ];

    tripleFilters.forEach((filter) => {
      const extras = {
        impact: filter.impact,
        tags: filter.tags
      };

      if (filter.status === 'committed') {
        extras['committed-on'] = baseDate;
        extras['decide-by'] = '2023-12-01';
      } else if (filter.status === 'open') {
        extras['decide-by'] = '2024-05-01';
      }

      adrs.push({
        name: filter.fileName,
        content: this.createADRContent(filter.title, filter.status, extras)
      });
    });

    // Scenario 3: date + status + impact combinations
    const dateStatusCombos = [
      {
        status: 'committed',
        impact: 'high',
        committedOn: new Date(baseDateObj.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days after
        title: 'Recent High Impact Commit',
        fileName: '0020-date-status-recent-high.md'
      },
      {
        status: 'open',
        impact: 'medium',
        decideBy: new Date(baseDateObj.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days before
        title: 'Overdue Medium Impact Decision',
        fileName: '0021-date-status-overdue-medium.md'
      }
    ];

    dateStatusCombos.forEach((combo) => {
      const extras = {
        impact: combo.impact,
        tags: ['date-status-combo', 'multi-filter']
      };

      if (combo.status === 'committed') {
        extras['committed-on'] = combo.committedOn;
        extras['decide-by'] = '2023-11-01';
      } else if (combo.status === 'open') {
        extras['decide-by'] = combo.decideBy;
        extras['review-by'] = '2024-01-01';
      }

      adrs.push({
        name: combo.fileName,
        content: this.createADRContent(combo.title, combo.status, extras)
      });
    });

    // Scenario 4: All filters combined (status + impact + tags + dates)
    const allFiltersCombo = {
      status: 'committed',
      impact: 'high',
      tags: ['architecture', 'security', 'critical'],
      committedOn: new Date(baseDateObj.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days after
      title: 'Ultimate Combined Filter Test',
      fileName: '0030-all-filters-combined.md'
    };

    adrs.push({
      name: allFiltersCombo.fileName,
      content: this.createADRContent(allFiltersCombo.title, allFiltersCombo.status, {
        impact: allFiltersCombo.impact,
        tags: allFiltersCombo.tags,
        'committed-on': allFiltersCombo.committedOn,
        'decide-by': '2023-10-15'
      })
    });

    if (includeNoMatches) {
      // Add ADRs that should NOT match when multiple filters are applied
      const noMatchScenarios = [
        {
          // Wrong status for combined filter
          status: 'deferred',
          impact: 'high',
          tags: ['architecture', 'security'],
          title: 'Wrong Status - Should Not Match',
          fileName: '0090-no-match-wrong-status.md'
        },
        {
          // Wrong impact for combined filter
          status: 'committed',
          impact: 'low',
          tags: ['architecture', 'security'],
          title: 'Wrong Impact - Should Not Match',
          fileName: '0091-no-match-wrong-impact.md'
        },
        {
          // Missing tags for combined filter
          status: 'committed',
          impact: 'high',
          tags: ['unrelated', 'different'],
          title: 'Wrong Tags - Should Not Match',
          fileName: '0092-no-match-wrong-tags.md'
        }
      ];

      noMatchScenarios.forEach((scenario) => {
        const extras = {
          impact: scenario.impact,
          tags: scenario.tags
        };

        if (scenario.status === 'committed') {
          extras['committed-on'] = baseDate;
        }

        adrs.push({
          name: scenario.fileName,
          content: this.createADRContent(scenario.title, scenario.status, extras)
        });
      });
    }

    return adrs;
  }

  /**
   * Create ADRs for testing filter boundary conditions and edge cases
   * Tests scenarios where filters barely match or barely don't match
   * @param {Object} options - Configuration options
   * @returns {Array} Array of ADR objects for boundary filter testing
   */
  static createFilterBoundaryTestData(options = {}) {
    const { baseDate = '2024-01-15' } = options;
    const adrs = [];
    const baseDateObj = new Date(baseDate);

    // Date boundary tests - exact date matches
    const dateBoundaryTests = [
      {
        title: 'Exact Committed Date Match',
        fileName: '0001-exact-committed-match.md',
        status: 'committed',
        frontmatter: {
          'committed-on': baseDate, // Exact match
          'decide-by': '2023-12-01',
          impact: 'medium',
          tags: ['boundary-test', 'exact-match']
        }
      },
      {
        title: 'One Day Before Committed',
        fileName: '0002-one-day-before-committed.md',
        status: 'committed',
        frontmatter: {
          'committed-on': new Date(baseDateObj.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day before
          'decide-by': '2023-12-01',
          impact: 'medium',
          tags: ['boundary-test', 'one-day-before']
        }
      },
      {
        title: 'One Day After Committed',
        fileName: '0003-one-day-after-committed.md',
        status: 'committed',
        frontmatter: {
          'committed-on': new Date(baseDateObj.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day after
          'decide-by': '2023-12-01',
          impact: 'medium',
          tags: ['boundary-test', 'one-day-after']
        }
      },
      {
        title: 'Exact Decide Date Match',
        fileName: '0004-exact-decide-match.md',
        status: 'open',
        frontmatter: {
          'decide-by': baseDate, // Exact match
          'review-by': '2024-01-01',
          impact: 'medium',
          tags: ['boundary-test', 'exact-decide']
        }
      }
    ];

    dateBoundaryTests.forEach((test) => {
      adrs.push({
        name: test.fileName,
        content: this.createADRContent(test.title, test.status, test.frontmatter)
      });
    });

    // Tag boundary tests - single tag matches in multi-tag scenarios
    const tagBoundaryTests = [
      {
        title: 'Single Matching Tag in Many',
        fileName: '0010-single-tag-match.md',
        status: 'open',
        frontmatter: {
          impact: 'high',
          tags: ['unrelated1', 'unrelated2', 'architecture', 'unrelated3'], // 'architecture' matches
          'decide-by': '2024-04-01'
        }
      },
      {
        title: 'First Tag Matches',
        fileName: '0011-first-tag-matches.md',
        status: 'open',
        frontmatter: {
          impact: 'medium',
          tags: ['api', 'unrelated1', 'unrelated2'], // 'api' matches
          'decide-by': '2024-04-01'
        }
      },
      {
        title: 'Last Tag Matches',
        fileName: '0012-last-tag-matches.md',
        status: 'open',
        frontmatter: {
          impact: 'low',
          tags: ['unrelated1', 'unrelated2', 'security'], // 'security' matches
          'decide-by': '2024-04-01'
        }
      },
      {
        title: 'No Tag Matches',
        fileName: '0013-no-tag-matches.md',
        status: 'open',
        frontmatter: {
          impact: 'high',
          tags: ['completely', 'unrelated', 'tags'],
          'decide-by': '2024-04-01'
        }
      }
    ];

    tagBoundaryTests.forEach((test) => {
      adrs.push({
        name: test.fileName,
        content: this.createADRContent(test.title, test.status, test.frontmatter)
      });
    });

    // Status boundary tests - case sensitivity and exact matches
    const statusBoundaryTests = [
      {
        title: 'Lowercase Open Status',
        fileName: '0020-lowercase-open.md',
        status: 'open', // Should match 'open' filter
        frontmatter: {
          impact: 'medium',
          tags: ['status-test'],
          'decide-by': '2024-04-01'
        }
      },
      {
        title: 'Mixed Case Status Test',
        fileName: '0021-mixed-case-status.md',
        status: 'Open', // May or may not match depending on case sensitivity
        frontmatter: {
          impact: 'medium',
          tags: ['status-test']
        }
      }
    ];

    statusBoundaryTests.forEach((test) => {
      adrs.push({
        name: test.fileName,
        content: this.createADRContent(test.title, test.status.toLowerCase(), test.frontmatter)
      });
    });

    // Impact boundary tests
    const impactBoundaryTests = [
      {
        title: 'Exact High Impact Match',
        fileName: '0030-exact-high-impact.md',
        status: 'open',
        frontmatter: {
          impact: 'high', // Should match ['high'] filter
          tags: ['impact-test'],
          'decide-by': '2024-04-01'
        }
      },
      {
        title: 'Medium Impact for High Filter',
        fileName: '0031-medium-for-high-filter.md',
        status: 'open',
        frontmatter: {
          impact: 'medium', // Should NOT match ['high'] filter
          tags: ['impact-test'],
          'decide-by': '2024-04-01'
        }
      }
    ];

    impactBoundaryTests.forEach((test) => {
      adrs.push({
        name: test.fileName,
        content: this.createADRContent(test.title, test.status, test.frontmatter)
      });
    });

    return adrs;
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
   * @returns {Object} GraphQL response with large number of ADR files
   */
  static createLargeDatasetResponse(fileCount = 1000) {
    const entries = [];

    for (let i = 0; i < fileCount; i++) {
      const title = `Large Dataset ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-large-dataset-adr-${i + 1}.md`;

      entries.push({
        name: fileName,
        object: {
          text: this.createADRContent(title, 'open', {
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
   * @returns {Object} GraphQL response designed for async processing tests
   */
  static createAsyncProcessingTestData(fileCount = 20) {
    const entries = [];

    for (let i = 0; i < fileCount; i++) {
      const title = `Async Processing Test ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-async-test-${i + 1}.md`;
      const status = TEST_CONFIG.adr.statuses[i % 4];

      entries.push({
        name: fileName,
        object: {
          text: this.createADRContent(title, status, {
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
   * Create ADRs with dates at filter boundaries
   * @param {string} baseDate - Base date for boundary testing
   * @returns {Array} Array of ADR objects with boundary dates
   */
  static createBoundaryDateADRs(baseDate = '2024-01-15') {
    const baseDateObj = new Date(baseDate);
    const oneDayBefore = new Date(baseDateObj.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAfter = new Date(baseDateObj.getTime() + 24 * 60 * 60 * 1000);

    const scenarios = [
      {
        title: 'Boundary Date - Exact Match',
        fileName: '0001-boundary-exact.md',
        status: 'committed',
        committedOn: baseDateObj.toISOString().split('T')[0]
      },
      {
        title: 'Boundary Date - One Day Before',
        fileName: '0002-boundary-before.md',
        status: 'committed',
        committedOn: oneDayBefore.toISOString().split('T')[0]
      },
      {
        title: 'Boundary Date - One Day After',
        fileName: '0003-boundary-after.md',
        status: 'committed',
        committedOn: oneDayAfter.toISOString().split('T')[0]
      },
      {
        title: 'Boundary Date - Decide Exact',
        fileName: '0004-boundary-decide-exact.md',
        status: 'open',
        decideBy: baseDateObj.toISOString().split('T')[0]
      }
    ];

    return scenarios.map((scenario) => ({
      name: scenario.fileName,
      content: this.createADRContent(scenario.title, scenario.status, {
        'committed-on': scenario.committedOn,
        'decide-by': scenario.decideBy || '2024-04-01',
        impact: 'medium',
        tags: ['boundary-test', 'date-edge-case']
      })
    }));
  }

  /**
   * Create ADRs with empty tag arrays
   * @param {number} count - Number of ADRs with empty tags to create
   * @returns {Array} Array of ADR objects with empty tag arrays
   */
  static createEmptyTagArrayADRs(count = 3) {
    const adrs = [];

    for (let i = 0; i < count; i++) {
      const title = `Empty Tags ADR ${i + 1}`;
      const fileName = `${String(i + 1).padStart(4, '0')}-empty-tags-${i + 1}.md`;

      adrs.push({
        name: fileName,
        content: this.createADRContent(title, 'open', {
          tags: [], // Empty array
          impact: 'medium',
          'decide-by': '2024-04-01'
        })
      });
    }

    return adrs;
  }

  /**
   * Create ADRs with single character fields (minimal valid values)
   * @returns {Array} Array of ADR objects with minimal field values
   */
  static createSingleCharacterFields() {
    const scenarios = [
      {
        title: 'A', // Single character title
        fileName: '0001-single-char-title.md',
        status: 'open',
        tags: ['a'], // Single character tag
        impact: 'low'
      },
      {
        title: 'Minimal Field Test',
        fileName: '0002-minimal-fields.md',
        status: 'committed',
        tags: ['x', 'y', 'z'], // Single character tags
        impact: 'high',
        committedOn: '2024-01-01' // Minimal valid date
      }
    ];

    return scenarios.map((scenario) => ({
      name: scenario.fileName,
      content: this.createADRContent(scenario.title, scenario.status, {
        tags: scenario.tags,
        impact: scenario.impact,
        'committed-on': scenario.committedOn,
        'decide-by': scenario.status === 'open' ? '2024-04-01' : undefined
      })
    }));
  }

  /**
   * Create a mock Octokit instance with error injection capabilities
   * @param {Object} errorScenarios - Configuration for different error scenarios
   * @param {Object} responses - Standard responses (when not erroring)
   * @returns {Object} Mock Octokit instance with error injection
   */
  static createMockOctokitWithErrors(errorScenarios = {}, responses = {}) {
    const defaultResponses = {
      graphql: this.createADRFilesResponse(),
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