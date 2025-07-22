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