# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

modr-bot is a Slack bot for managing Architectural Decision Records (ADRs) stored in GitHub repositories. It allows teams to create, retrieve, and collaborate on ADRs through Slack slash commands.

## Development Commands

- **Start development server**: `yarn run dev` (uses nodemon with hot reload and dotenv for environment variables)
- **No test framework configured**: Currently shows "Error: no test specified" - check with maintainer for testing approach

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

## Key Patterns

- **Module imports**: Uses ES6 modules (`"type": "module"` in package.json)
- **Error handling**: Try/catch blocks with console logging
- **GitHub operations**: All done via GraphQL and REST API through Octokit
- **Slack responses**: Uses Block Kit format for rich messaging
- **Command parsing**: Commander.js processes slash command arguments with custom validation

## Workflow Reminders

- Check Jira for any questions about tasks or epics with the prefix MODR
- Make sure to keep CLAUDE.md up to date with any changes you make to the codebase
