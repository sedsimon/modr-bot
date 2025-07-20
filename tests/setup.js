// Test setup file for Jest
// This file runs before all tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SLACK_BOT_TOKEN = 'test-bot-token';
process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
process.env.SLACK_APP_TOKEN = 'test-app-token';
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.GITHUB_USER = 'test-user';
process.env.GITHUB_REPO = 'test-repo';
process.env.GITHUB_DEFAULT_BRANCH = 'main';