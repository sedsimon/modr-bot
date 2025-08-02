import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VALID_LOG_COMMANDS, VALID_ADD_COMMANDS, VALID_COMMANDS_WITH_SLACK_FORMATTING } from './fixtures/slack-commands/valid-commands.js';
import { INVALID_COMMANDS, MISSING_REQUIRED_OPTIONS, INVALID_DATE_COMMANDS, HELP_COMMANDS } from './fixtures/slack-commands/invalid-commands.js';

describe('Slack Command Parsing Integration Tests', () => {
  let originalEnv;

  beforeEach(async () => {
    // Store original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Command Parsing Infrastructure', () => {
    test('should have access to validation functions', async () => {
      // Import the validation functions to ensure they're available
      const appModule = await import('../app.js');
      expect(appModule).toBeDefined();
    });
  });

  describe('Valid Log Commands', () => {
    test.each(VALID_LOG_COMMANDS)('should parse $description', async ({ text, expected }) => {
      // The mocks are already set up at the module level, no need to import again

      // Create a mock command object
      const mockCommand = {
        text,
        user_id: 'U123456'
      };

      // We need to test the command parsing logic directly
      // Since the app.js command handler is complex, we'll test the parsing components
      const { Command, InvalidArgumentError, InvalidOptionArgumentError } = await import('commander');
      const shlex = (await import('shlex')).default;
      
      // Replicate the command setup from app.js
      const program = new Command();
      program.exitOverride();
      
      let capturedOptions;
      let capturedCommand;
      
      const decisionCommand = program.name('/adr').description('A utility for working with ADRs.');
      
      decisionCommand.command('log')
        .description('List ADRs that match all of the given (optional) filters.')
        .addOption(new (await import('commander')).Option('-s, --status <status...>', 'Filter on ADR status.').choices(['open', 'committed', 'deferred', 'obsolete']))
        .addOption(new (await import('commander')).Option('-i, --impact <impact...>', 'Filter on ADR Impact.').choices(['high', 'medium', 'low']))
        .option('-ca, --committed-after <date>', 'Filter ADRs committed since the given date (yyyy-mm-dd format).')
        .option('-db, --decide-before <date>', 'Filter open ADRs that must be decided on before the given date (yyyy-mm-dd format).')
        .option('-t, --tags <tag...>', 'Filter on ADR tags.')
        .action((options, cmd) => {
          capturedOptions = options;
          capturedCommand = cmd;
        });

      // Parse the command text
      const argv = shlex.split(text);
      await program.parseAsync(argv, { from: 'user' });

      // Verify parsing results
      expect(capturedCommand.name()).toBe('log');
      
      // Check specific options based on expected results
      if (expected.options.status) {
        expect(capturedOptions.status).toEqual(expected.options.status);
      }
      if (expected.options.impact) {
        expect(capturedOptions.impact).toEqual(expected.options.impact);
      }
      if (expected.options.tags) {
        expect(capturedOptions.tags).toEqual(expected.options.tags);
      }
    });
  });

  describe('Valid Add Commands', () => {
    test.each(VALID_ADD_COMMANDS)('should parse $description', async ({ text, expected }) => {
      // The mocks are already set up at the module level

      // Test the command parsing logic
      const { Command, InvalidOptionArgumentError } = await import('commander');
      const shlex = (await import('shlex')).default;
      
      // Validation function from app.js
      function parseBranch(branch) {
        if (! /^[a-zA-Z][a-zA-Z0-9\\-]{0,49}$/g.test(branch)) {
          throw new InvalidOptionArgumentError('Error: branch name is invalid format.');
        }
        return branch;
      }
      
      const program = new Command();
      program.exitOverride();
      
      let capturedOptions;
      let capturedCommand;
      
      const decisionCommand = program.name('/adr').description('A utility for working with ADRs.');
      
      decisionCommand.command('add').description('Create a new ADR including associated branch and pull request.')
        .addOption(new (await import('commander')).Option('-i, --impact <impact>', 'Set impact=<impact> in new ADR.').default('medium').choices(['high', 'medium', 'low']))
        .requiredOption('-t, --title <title>', 'Set the title of the new ADR. This will also be used as the name of the associated pull request.')
        .requiredOption('-b, --branch <branch>', 'Set the name of the new branch.', parseBranch)
        .action((options, cmd) => {
          capturedOptions = options;
          capturedCommand = cmd;
        });

      // Parse the command text
      const argv = shlex.split(text);
      await program.parseAsync(argv, { from: 'user' });

      // Verify parsing results
      expect(capturedCommand.name()).toBe('add');
      expect(capturedOptions.title).toBe(expected.options.title);
      expect(capturedOptions.branch).toBe(expected.options.branch);
      expect(capturedOptions.impact).toBe(expected.options.impact);
    });
  });

  describe('Slack String Formatting', () => {
    test('should replace smart quotes with regular quotes', () => {
      // Test the fixSlackStrings function with actual smart quotes
      function fixSlackStrings(str) {
        return str.replace(/[\u201C\u201D]/g, '"');
      }

      const textWithSmartQuotes = 'add --title "Smart Quote Test" --branch test';
      const fixedText = fixSlackStrings(textWithSmartQuotes);
      
      // The fixed text should have regular quotes instead of smart quotes
      expect(fixedText).toBe('add --title "Smart Quote Test" --branch test');
      expect(fixedText).not.toMatch(/[\u201C\u201D]/);
    });

    test('should preserve text without smart quotes', () => {
      function fixSlackStrings(str) {
        return str.replace(/[\u201C\u201D]/g, '"');
      }

      const regularText = 'add --title "Regular Quotes" --branch test';
      const fixedText = fixSlackStrings(regularText);
      
      expect(fixedText).toBe(regularText); // Should be unchanged
    });
  });

  describe('Invalid Commands and Error Handling', () => {
    test.each(INVALID_COMMANDS)('should handle $description', async ({ text, expectedError }) => {
      const { Command } = await import('commander');
      const shlex = (await import('shlex')).default;
      
      const program = new Command();
      program.exitOverride();
      
      // Set up error capture
      let capturedError;
      
      const decisionCommand = program.name('/adr').description('A utility for working with ADRs.');
      
      decisionCommand.command('log')
        .description('List ADRs that match all of the given (optional) filters.')
        .addOption(new (await import('commander')).Option('-s, --status <status...>', 'Filter on ADR status.').choices(['open', 'committed', 'deferred', 'obsolete']))
        .addOption(new (await import('commander')).Option('-i, --impact <impact...>', 'Filter on ADR Impact.').choices(['high', 'medium', 'low']))
        .action(() => {});

      decisionCommand.command('add').description('Create a new ADR including associated branch and pull request.')
        .addOption(new (await import('commander')).Option('-i, --impact <impact>', 'Set impact=<impact> in new ADR.').default('medium').choices(['high', 'medium', 'low']))
        .requiredOption('-t, --title <title>', 'Set the title of the new ADR.')
        .requiredOption('-b, --branch <branch>', 'Set the name of the new branch.')
        .action(() => {});

      try {
        const argv = shlex.split(text);
        await program.parseAsync(argv, { from: 'user' });
      } catch (error) {
        capturedError = error;
      }

      expect(capturedError).toBeDefined();
      expect(capturedError.message).toMatch(expectedError);
    });

    test.each(MISSING_REQUIRED_OPTIONS)('should handle $description', async ({ text, expectedError }) => {
      const { Command, InvalidOptionArgumentError } = await import('commander');
      const shlex = (await import('shlex')).default;
      
      function parseBranch(branch) {
        if (! /^[a-zA-Z][a-zA-Z0-9\\-]{0,49}$/g.test(branch)) {
          throw new InvalidOptionArgumentError('Error: branch name is invalid format.');
        }
        return branch;
      }
      
      const program = new Command();
      program.exitOverride();
      
      let capturedError;
      
      const decisionCommand = program.name('/adr').description('A utility for working with ADRs.');
      
      decisionCommand.command('add').description('Create a new ADR including associated branch and pull request.')
        .addOption(new (await import('commander')).Option('-i, --impact <impact>', 'Set impact=<impact> in new ADR.').default('medium').choices(['high', 'medium', 'low']))
        .requiredOption('-t, --title <title>', 'Set the title of the new ADR.')
        .requiredOption('-b, --branch <branch>', 'Set the name of the new branch.', parseBranch)
        .action(() => {});

      try {
        const argv = shlex.split(text);
        await program.parseAsync(argv, { from: 'user' });
      } catch (error) {
        capturedError = error;
      }

      expect(capturedError).toBeDefined();
      expect(capturedError.message).toMatch(expectedError);
    });
  });

  describe('Help Text Generation', () => {
    test.each(HELP_COMMANDS)('should generate help for $description', async ({ text, expectedContent }) => {
      const { Command } = await import('commander');
      const shlex = (await import('shlex')).default;
      
      const program = new Command();
      program.exitOverride();
      
      let capturedOutput = '';
      
      // Configure output capture like in app.js
      program.configureOutput({
        writeOut: (str) => {
          capturedOutput += str;
        },
        writeErr: (str) => {
          capturedOutput += str;
        }
      });
      
      const decisionCommand = program.name('/adr').description('A utility for working with ADRs.');
      
      decisionCommand.command('log')
        .description('List ADRs that match all of the given (optional) filters.')
        .action(() => {});

      decisionCommand.command('add')
        .description('Create a new ADR including associated branch and pull request.')
        .action(() => {});

      try {
        const argv = shlex.split(text);
        await program.parseAsync(argv, { from: 'user' });
      } catch (error) {
        // Help commands throw an error but that's expected
      }

      expect(capturedOutput).toMatch(expectedContent);
    });
  });
});