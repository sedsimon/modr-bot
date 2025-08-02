/**
 * Valid command test fixtures for Slack /adr command parsing
 */

export const VALID_LOG_COMMANDS = [
  {
    text: 'log',
    description: 'Basic log command without filters',
    expected: {
      command: 'log',
      options: {}
    }
  },
  {
    text: 'log --status open',
    description: 'Filter by single status',
    expected: {
      command: 'log',
      options: { status: ['open'] }
    }
  },
  {
    text: 'log --status open committed',
    description: 'Filter by multiple statuses',
    expected: {
      command: 'log',
      options: { status: ['open', 'committed'] }
    }
  },
  {
    text: 'log --impact high',
    description: 'Filter by single impact level',
    expected: {
      command: 'log',
      options: { impact: ['high'] }
    }
  },
  {
    text: 'log --impact high medium low',
    description: 'Filter by multiple impact levels',
    expected: {
      command: 'log',
      options: { impact: ['high', 'medium', 'low'] }
    }
  },
  {
    text: 'log --tags architecture',
    description: 'Filter by single tag',
    expected: {
      command: 'log',
      options: { tags: ['architecture'] }
    }
  },
  {
    text: 'log --tags architecture api infrastructure',
    description: 'Filter by multiple tags',
    expected: {
      command: 'log',
      options: { tags: ['architecture', 'api', 'infrastructure'] }
    }
  },
  {
    text: 'log --committed-after 2024-01-01',
    description: 'Filter by committed after date',
    expected: {
      command: 'log',
      options: { committedAfter: Date.parse('2024-01-01') }
    }
  },
  {
    text: 'log --decide-before 2024-12-31',
    description: 'Filter by decide before date',
    expected: {
      command: 'log',
      options: { decideBefore: Date.parse('2024-12-31') }
    }
  },
  {
    text: 'log --status open --impact high --tags architecture',
    description: 'Complex filter combination',
    expected: {
      command: 'log',
      options: {
        status: ['open'],
        impact: ['high'],
        tags: ['architecture']
      }
    }
  },
  {
    text: 'log --status open committed --impact high medium --committed-after 2024-01-01 --decide-before 2024-12-31',
    description: 'Maximum complexity filter',
    expected: {
      command: 'log',
      options: {
        status: ['open', 'committed'],
        impact: ['high', 'medium'],
        committedAfter: Date.parse('2024-01-01'),
        decideBefore: Date.parse('2024-12-31')
      }
    }
  }
];

export const VALID_ADD_COMMANDS = [
  {
    text: 'add --title "Test Decision" --branch test-decision --impact medium',
    description: 'Basic add command with all required options',
    expected: {
      command: 'add',
      options: {
        title: 'Test Decision',
        branch: 'test-decision',
        impact: 'medium'
      }
    }
  },
  {
    text: 'add -t "API Design" -b api-design -i high',
    description: 'Add command with short option flags',
    expected: {
      command: 'add',
      options: {
        title: 'API Design',
        branch: 'api-design',
        impact: 'high'
      }
    }
  },
  {
    text: 'add --title "Database Migration" --branch db-migration',
    description: 'Add command without explicit impact (should default to medium)',
    expected: {
      command: 'add',
      options: {
        title: 'Database Migration',
        branch: 'db-migration',
        impact: 'medium'
      }
    }
  },
  {
    text: 'add --title "Security Protocol" --branch security-proto --impact low',
    description: 'Add command with low impact',
    expected: {
      command: 'add',
      options: {
        title: 'Security Protocol',
        branch: 'security-proto',
        impact: 'low'
      }
    }
  }
];

export const VALID_COMMANDS_WITH_SLACK_FORMATTING = [
  {
    text: 'add --title "Smart Quote Test" --branch smart-quotes --impact high',
    description: 'Command with smart quotes that need fixing',
    expected: {
      command: 'add',
      options: {
        title: 'Smart Quote Test',
        branch: 'smart-quotes',
        impact: 'high'
      }
    }
  },
  {
    text: 'log --tags "complex architecture" "api design"',
    description: 'Command with quoted multi-word tags',
    expected: {
      command: 'log',
      options: {
        tags: ['complex architecture', 'api design']
      }
    }
  }
];