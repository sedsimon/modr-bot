# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

modr-bot is a Slack bot for managing Architectural Decision Records (ADRs) stored in GitHub repositories. It allows teams to create, retrieve, and collaborate on ADRs through Slack slash commands.

## Development Commands

- **Start development server**: `yarn run dev` (uses nodemon with hot reload and dotenv for environment variables)
- **Run tests**: `yarn test` (runs Jest with ES6 module support and coverage reporting)
- **Run tests with coverage**: `yarn test:coverage` (generates HTML coverage reports in `coverage/` directory)
- **Run tests in watch mode**: `yarn test:watch` (runs tests in watch mode for development)

## Architecture

### Core Components

- **app.js**: Main Slack Bolt application entry point
  - Handles `/adr` slash command with `log` and `add` subcommands
  - Uses Commander.js for CLI-style argument parsing within Slack
  - Implements socket mode for Slack connection

- **lib/adrs.js**: GitHub integration layer
  - Uses Octokit for GitHub API communication
  - Implements `getAdrFiles()` for retrieving ADRs with filtering
  - Implements `createAdrFile()` for creating new ADRs with branches and PRs

- **lib/adrParser.js**: ADR file parsing
  - Parses markdown files with YAML frontmatter
  - Uses unified/remark for markdown processing
  - Extracts structured data from ADR sections

- **lib/blockFormatter.js**: Slack message formatting
  - Converts parsed ADR data to Slack Block Kit format
  - Configurable via `ADR_TO_BLOCK_FORMATTER` environment variable

### ADR File Structure

ADRs use YAML frontmatter with these fields:
- `impact`: high|medium|low
- `reversibility`: high|medium|low  
- `status`: open|committed|deferred|obsolete
- `tags`: array of strings
- `review-by` and `decide-by`: date strings

Template located at `/docs/decisions/decision-template.md`

## Environment Configuration

Required environment variables:
- **Slack**: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN`
- **GitHub**: `GITHUB_TOKEN`, `GITHUB_USER`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH`
- **ADR Settings**: `GITHUB_PATH_TO_ADRS`, `GITHUB_ADR_REGEX`, `GITHUB_ADR_TEMPLATE`
- **Customization**: `ADR_PARSER`, `ADR_TO_BLOCK_TRANSFORMER`

Use `.env` file for development (loaded by dotenv package).

## Testing Infrastructure

The project has comprehensive test infrastructure with:

- **Jest with ES6 module support**: Uses experimental VM modules for ESM compatibility
- **Mock factory patterns**: `MockFactory` class provides consistent mock data across tests
- **Centralized test configuration**: `testConfig.js` provides consistent environment variables and test data
- **Comprehensive fixtures**: Sample ADR files with various statuses, impacts, and edge cases
- **Test helpers**: Utilities for loading fixtures, creating mocks, and managing test environment
- **Octokit mocking strategy**: Proper mocking of GitHub API calls using `jest.unstable_mockModule`
- **Coverage reporting**: HTML and LCOV coverage reports generated in `coverage/` directory

### Test Structure
- `tests/lib/adrs.test.js` - Complete test suite for ADR module with 34 test cases
- `tests/fixtures/adrs/` - Sample ADR files (0001-0008 plus edge cases)
- `tests/utils/mockFactory.js` - Mock data factory for GitHub API responses
- `tests/config/testConfig.js` - Centralized test configuration

## Key Patterns

- **Module imports**: Uses ES6 modules (`"type": "module"` in package.json)
- **Error handling**: Try/catch blocks with console logging
- **GitHub operations**: All done via GraphQL and REST API through Octokit
- **Slack responses**: Uses Block Kit format for rich messaging
- **Command parsing**: Commander.js processes slash command arguments with custom validation
- **Test mocking**: Uses `jest.unstable_mockModule` for ES6 module mocking at module level

## Workflow Reminders

- Check Jira for any questions about tasks or epics with the prefix MODR
- Make sure to keep CLAUDE.md up to date with any changes you make to the codebase
- Use yarn instead of npm when possible
