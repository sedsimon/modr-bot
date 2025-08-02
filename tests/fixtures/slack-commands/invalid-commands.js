/**
 * Invalid command test fixtures for Slack /adr command parsing
 * These commands should produce errors or help text
 */

export const INVALID_COMMANDS = [
  {
    text: 'invalid-command',
    description: 'Unknown command',
    expectedError: /unknown command 'invalid-command'/i
  },
  {
    text: 'log --unknown-option',
    description: 'Unknown option on log command',
    expectedError: /unknown option.*--unknown-option/i
  },
  {
    text: 'add --title "Test" --branch test --unknown-option',
    description: 'Unknown option on add command', 
    expectedError: /unknown option.*--unknown-option/i
  },
  {
    text: 'log --status invalid-status',
    description: 'Invalid status choice',
    expectedError: /argument.*invalid-status.*is invalid/i
  },
  {
    text: 'log --impact invalid-impact',
    description: 'Invalid impact choice',
    expectedError: /argument.*invalid-impact.*is invalid/i
  },
  {
    text: 'add --impact invalid-impact --title "Test" --branch test',
    description: 'Invalid impact on add command',
    expectedError: /argument.*invalid-impact.*is invalid/i
  }
];

export const MISSING_REQUIRED_OPTIONS = [
  {
    text: 'add',
    description: 'Add command with no options',
    expectedError: /required option.*--title.*not specified/i
  },
  {
    text: 'add --title "Test Decision"',
    description: 'Add command missing branch',
    expectedError: /required option.*--branch.*not specified/i
  },
  {
    text: 'add --branch test-branch',
    description: 'Add command missing title',
    expectedError: /required option.*--title.*not specified/i
  },
  {
    text: 'add --title "Test" --branch "invalid_branch"',
    description: 'Add command with invalid branch name format',
    expectedError: /branch name is invalid format/i
  }
];

export const INVALID_DATE_COMMANDS = [
  {
    text: 'log --committed-after invalid-date',
    description: 'Invalid date format for committed-after',
    expectedError: /unable to parse date.*invalid-date/i
  },
  {
    text: 'log --decide-before not-a-date',
    description: 'Invalid date format for decide-before',
    expectedError: /unable to parse date.*not-a-date/i
  },
  {
    text: 'log --committed-after 2024-99-99',
    description: 'Impossible date for committed-after',
    expectedError: /unable to parse date.*2024-99-99/i
  }
];

export const HELP_COMMANDS = [
  {
    text: '--help',
    description: 'Root help command',
    expectsHelp: true,
    expectedContent: /A utility for working with ADRs/i
  },
  {
    text: 'log --help',
    description: 'Log subcommand help',
    expectsHelp: true,
    expectedContent: /List ADRs that match all of the given.*filters/i
  },
  {
    text: 'add --help', 
    description: 'Add subcommand help',
    expectsHelp: true,
    expectedContent: /Create a new ADR including associated branch and pull request/i
  }
];