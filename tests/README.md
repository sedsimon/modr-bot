# Test Data Management and Fixtures

This directory contains test fixtures, utilities, and configuration for consistent testing across all test suites in the modr-bot project.

## Directory Structure

```
tests/
├── README.md                 # This file
├── setup.js                 # Jest setup configuration
├── config/
│   └── testConfig.js        # Centralized test configuration
├── fixtures/
│   ├── adrs/               # Sample ADR markdown files
│   └── github/             # GitHub API response fixtures
├── utils/
│   ├── testHelpers.js      # Test utility functions
│   └── mockFactory.js      # Mock data factory
└── fixtures.test.js        # Tests for the fixtures themselves
```

## Available Test Fixtures

### ADR Files (`tests/fixtures/adrs/`)

- `0001-test-adr-open.md` - ADR with "open" status, high impact, with all fields
- `0002-test-adr-committed.md` - ADR with "committed" status, medium impact
- `0003-test-adr-deferred.md` - ADR with "deferred" status, low impact
- `0004-test-adr-obsolete.md` - ADR with "obsolete" status
- `0005-test-adr-minimal.md` - Minimal ADR with only required fields
- `invalid-no-frontmatter.md` - Invalid ADR without YAML frontmatter

### GitHub API Fixtures (`tests/fixtures/github/`)

- `adr-files-response.js` - Mock responses for GitHub GraphQL and REST API calls

## Test Utilities

### Test Helpers (`tests/utils/testHelpers.js`)

```javascript
import { loadFixture, loadADRFixture, createMockOctokit } from './utils/testHelpers.js';

// Load any fixture file
const content = await loadFixture('adrs/0001-test-adr-open.md');

// Load and parse an ADR fixture
const { content, ast } = await loadADRFixture('0001-test-adr-open.md');

// Create a mock Octokit instance
const mockOctokit = createMockOctokit({
  graphql: mockGraphQLResponse,
  createRef: mockBranchResponse
});
```

### Mock Factory (`tests/utils/mockFactory.js`)

```javascript
import { MockFactory } from './utils/mockFactory.js';

// Create mock GitHub responses
const adrFilesResponse = MockFactory.createADRFilesResponse();
const branchResponse = MockFactory.createBranchResponse('feature/test');
const prResponse = MockFactory.createPullRequestResponse(123, 'Test PR');

// Create mock Slack payloads
const slackCommand = MockFactory.createSlackCommand('log --status open');

// Create custom ADR content
const adrContent = MockFactory.createADRContent('Test Decision', 'committed', {
  impact: 'high',
  tags: ['test']
});
```

### Test Configuration (`tests/config/testConfig.js`)

```javascript
import { getTestEnvironment, getADRTestData } from './config/testConfig.js';

// Get test environment variables
const env = getTestEnvironment({ GITHUB_USER: 'custom-user' });

// Get predefined ADR test data
const openADR = getADRTestData('open');
const committedADR = getADRTestData('committed');
```

## Writing Tests

### Example Test Structure

```javascript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { loadADRFixture, setupTestEnvironment } from './utils/testHelpers.js';
import { MockFactory } from './utils/mockFactory.js';

describe('Your Module', () => {
  beforeEach(() => {
    // Set up test environment
    setupTestEnvironment();
  });

  test('should handle ADR data correctly', async () => {
    // Load test fixture
    const { content, ast } = await loadADRFixture('0001-test-adr-open.md');
    
    // Create mock responses
    const mockOctokit = MockFactory.createMockOctokit({
      graphql: MockFactory.createADRFilesResponse()
    });
    
    // Your test logic here
    expect(content).toContain('status: open');
  });
});
```

### Best Practices

1. **Use existing fixtures** whenever possible instead of creating inline test data
2. **Use MockFactory** for consistent mock responses across tests
3. **Set up test environment** using `setupTestEnvironment()` for isolated tests
4. **Clean up** after tests to ensure no side effects between test runs
5. **Use descriptive test names** that explain what is being tested

## Environment Variables

The following environment variables are automatically set up for testing:

- `NODE_ENV=test`
- `SLACK_BOT_TOKEN=xoxb-test-bot-token`
- `SLACK_SIGNING_SECRET=test-signing-secret`
- `SLACK_APP_TOKEN=xapp-test-app-token`
- `GITHUB_TOKEN=ghp_test-github-token`
- `GITHUB_USER=test-user`
- `GITHUB_REPO=test-repo`
- `GITHUB_DEFAULT_BRANCH=main`
- `GITHUB_PATH_TO_ADRS=docs/decisions`
- `GITHUB_ADR_REGEX=\\d{4}-.*\\.md`

You can override these in individual tests using `setupTestEnvironment(overrides)`.

## Adding New Fixtures

1. **ADR Fixtures**: Add new `.md` files to `tests/fixtures/adrs/` following the existing naming pattern
2. **GitHub Fixtures**: Add new mock responses to `tests/fixtures/github/adr-files-response.js`
3. **Update MockFactory**: Add new factory methods for generating mock data
4. **Update Tests**: Add tests for new fixtures in `tests/fixtures.test.js`

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test fixtures.test.js

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```