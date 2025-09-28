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

## GitHub Project Discovery and Management

For GitHub Issues and Projects workflow, use dynamic project discovery:

1. **Primary**: Look for project matching repo name: `gh project list --owner <owner> --format json | jq '.projects[] | select(.title == "<repo-name>")'`
2. **Fallback**: If not found or multiple matches, ask user which project to use
3. **Note**: Projects v2 are workspace-level, not repo-associated, so `gh repo view --json projects` returns empty

This approach replaces hardcoded project IDs since Projects v2 are not directly linked to repositories.

### GitHub Project Management Commands

#### Project Information
- **List projects**: `gh project list --owner <owner> --format json`
- **View project details**: `gh project view <number> --owner <owner> --format json`
- **List project items**: `gh project item-list <number> --owner <owner> --format json`

#### Adding Issues to Projects
- **Add issue to project**: `gh project item-add <project-number> --owner <owner> --url <issue-url>`

#### Getting Project Field Information
```bash
# Get project fields and their options (for custom fields like Type, Status)
gh api graphql -f query='query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          __typename
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name }
          }
        }
      }
    }
  }
}'
```

#### Setting Project Field Values
```bash
# Set custom field values for project items
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> --field-id <FIELD_ID> --single-select-option-id <OPTION_ID>
```

### modr-bot Project Field IDs
- **Project ID**: `PVT_kwHOABCm3s4BEJmh`
- **Type Field ID**: `PVTSSF_lAHOABCm3s4BEJmhzg13K1A`
  - Epic: `6999a64a`
  - Task: `45e7c4fa`
- **Status Field ID**: `PVTSSF_lAHOABCm3s4BEJmhzg13GPA`
  - Todo: `f75ad846`
  - In Progress: `47fc9ee4`
  - In Review: `6217f801`
  - Done: `98236657`

### Issue Management
- **Create sub-issue relationships**: Use GitHub's sub-issue API via the GitHub MCP tools
- **Get issue details**: `mcp__github__get_issue` with owner, repo, issue_number
- **Add sub-issues**: `mcp__github__add_sub_issue` with parent issue number and sub-issue ID

## Custom Commands and Agents

This project includes custom Claude Code commands and agents for GitHub Issues and Projects workflow:

### Commands

- **epic-tasks**: Takes a GitHub issue number (must be labeled as "epic") and breaks it down into subtasks
  - Usage: `/epic-tasks <issue-number>`
  - Validates the issue has "epic" label
  - Creates subtasks as GitHub issues linked to the parent epic via task lists

- **code**: Implements a GitHub issue with code development
  - Usage: `/code <issue-number>`
  - Creates feature branch, implements code, and creates PR
  - Links PR to close the issue automatically

- **plan**: Creates technical implementation plans for GitHub issues
  - Usage: `/plan <issue-number>`
  - Updates issue description with technical plan
  - Uses technical-planner and plan-decomposer agents

### Agents

All agents work with GitHub Issues and Projects:
- **technical-planner**: Creates comprehensive technical implementation plans
- **plan-decomposer**: Evaluates plans for complexity and breaks them down if needed
- **code-developer**: Implements features from technical specifications
- **code-qa-reviewer**: Performs quality assurance review of code changes
- **pr-code-reviewer**: Conducts thorough code reviews of pull requests

## Workflow Reminders

- Check GitHub Issues and Projects for any questions about tasks or epics
- Make sure to keep CLAUDE.md up to date with any changes you make to the codebase
- Use yarn instead of npm when possible
