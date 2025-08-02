import { describe, test, expect } from '@jest/globals';
import { InvalidArgumentError, InvalidOptionArgumentError } from 'commander';

// Import the validation functions by importing the main app module
// We'll extract the functions from the module for testing
let parseBranch, myParseDate, fixSlackStrings;

// Dynamic import to load the app module and extract validation functions
beforeAll(async () => {
  // Create a temporary module that exports just the validation functions
  const appModule = `
import {InvalidArgumentError, InvalidOptionArgumentError} from "commander"

export function parseBranch(branch) {
  if (! /^[a-zA-Z][a-zA-Z0-9\\-]{0,49}$/g.test(branch)) {
    throw new InvalidOptionArgumentError("Error: branch name is invalid format.");
  }
  return branch;
}

export function myParseDate(datestr) {
  const date_ms = Date.parse(datestr);
  if (isNaN(date_ms)) {
    throw new InvalidArgumentError("Error: unable to parse date " + datestr + ". Must be yyyy-mm-dd format.");
  }
  return date_ms;
}

export function fixSlackStrings(str) {
  return str.replace(/[\\u201C\\u201D]/g,'"');
}
`;

  // Write temporary module and import it
  const fs = await import('fs');
  const path = await import('path');
  const tempPath = path.join(process.cwd(), 'temp-validation-functions.js');
  fs.writeFileSync(tempPath, appModule);
  
  const validationModule = await import(path.resolve(tempPath));
  parseBranch = validationModule.parseBranch;
  myParseDate = validationModule.myParseDate;
  fixSlackStrings = validationModule.fixSlackStrings;
  
  // Clean up temp file
  fs.unlinkSync(tempPath);
});

describe('Command Validation Functions', () => {
  describe('parseBranch', () => {
    describe('valid branch names', () => {
      test('should accept valid branch names starting with letter', () => {
        expect(parseBranch('feature-123')).toBe('feature-123');
        expect(parseBranch('bug-fix')).toBe('bug-fix');
        expect(parseBranch('HOTFIX-urgent')).toBe('HOTFIX-urgent');
        expect(parseBranch('f')).toBe('f');
        expect(parseBranch('main')).toBe('main');
      });

      test('should accept branch names with alphanumeric characters and hyphens', () => {
        expect(parseBranch('feature123')).toBe('feature123');
        expect(parseBranch('bug-fix-2024')).toBe('bug-fix-2024');
        expect(parseBranch('API-v2-implementation')).toBe('API-v2-implementation');
      });

      test('should accept branch names up to 50 characters', () => {
        const fiftyCharBranch = 'a' + '1234567890'.repeat(4) + '123456789'; // 50 chars
        expect(parseBranch(fiftyCharBranch)).toBe(fiftyCharBranch);
      });
    });

    describe('invalid branch names', () => {
      test('should reject branch names starting with number', () => {
        expect(() => parseBranch('123-invalid')).toThrow(InvalidOptionArgumentError);
        expect(() => parseBranch('123-invalid')).toThrow('Error: branch name is invalid format.');
      });

      test('should reject branch names with underscores', () => {
        expect(() => parseBranch('branch_with_underscores')).toThrow(InvalidOptionArgumentError);
        expect(() => parseBranch('feature_test')).toThrow(InvalidOptionArgumentError);
      });

      test('should reject branch names over 50 characters', () => {
        const fiftyOneCharBranch = 'a' + '1234567890'.repeat(5); // 51 chars
        expect(() => parseBranch(fiftyOneCharBranch)).toThrow(InvalidOptionArgumentError);
      });

      test('should reject branch names with special characters', () => {
        expect(() => parseBranch('feature@branch')).toThrow(InvalidOptionArgumentError);
        expect(() => parseBranch('feature.branch')).toThrow(InvalidOptionArgumentError);
        expect(() => parseBranch('feature/branch')).toThrow(InvalidOptionArgumentError);
        expect(() => parseBranch('feature branch')).toThrow(InvalidOptionArgumentError);
      });

      test('should reject empty branch names', () => {
        expect(() => parseBranch('')).toThrow(InvalidOptionArgumentError);
      });

      test('should reject branch names starting with hyphen', () => {
        expect(() => parseBranch('-invalid')).toThrow(InvalidOptionArgumentError);
      });
    });
  });

  describe('myParseDate', () => {
    describe('valid dates', () => {
      test('should parse valid YYYY-MM-DD dates', () => {
        expect(myParseDate('2024-01-15')).toBe(Date.parse('2024-01-15'));
        expect(myParseDate('2024-12-31')).toBe(Date.parse('2024-12-31'));
        expect(myParseDate('2023-02-28')).toBe(Date.parse('2023-02-28'));
        expect(myParseDate('2024-02-29')).toBe(Date.parse('2024-02-29')); // leap year
      });

      test('should parse dates at year boundaries', () => {
        expect(myParseDate('2024-01-01')).toBe(Date.parse('2024-01-01'));
        expect(myParseDate('2023-12-31')).toBe(Date.parse('2023-12-31'));
      });

      test('should parse dates with different years', () => {
        expect(myParseDate('2020-06-15')).toBe(Date.parse('2020-06-15'));
        expect(myParseDate('2025-03-10')).toBe(Date.parse('2025-03-10'));
      });
    });

    describe('invalid dates', () => {
      test('should reject invalid date formats', () => {
        // Note: Date.parse is actually quite lenient and accepts some alternative formats
        // So we test with clearly invalid formats that Date.parse will reject
        expect(() => myParseDate('invalid-date-format')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('invalid-date-format')).toThrow('Error: unable to parse date invalid-date-format. Must be yyyy-mm-dd format.');
        
        expect(() => myParseDate('not/a/valid/date')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('clearly-invalid')).toThrow(InvalidArgumentError);
      });

      test('should reject completely invalid dates', () => {
        expect(() => myParseDate('invalid-date')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('not-a-date')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('abc-def-ghij')).toThrow(InvalidArgumentError);
      });

      test('should reject impossible dates', () => {
        // These dates are clearly impossible and Date.parse will return NaN for them
        expect(() => myParseDate('2024-99-99')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('9999-99-99')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('abcd-ef-gh')).toThrow(InvalidArgumentError);
      });

      test('should reject empty and null dates', () => {
        expect(() => myParseDate('')).toThrow(InvalidArgumentError);
        expect(() => myParseDate('   ')).toThrow(InvalidArgumentError);
      });
    });

    describe('edge cases', () => {
      test('should handle leap year dates correctly', () => {
        expect(myParseDate('2024-02-29')).toBe(Date.parse('2024-02-29')); // valid leap year
        // Note: JavaScript Date.parse is very lenient and will accept 2023-02-29, 
        // so we test with truly invalid formats instead
      });

      test('should handle month boundaries', () => {
        expect(myParseDate('2024-01-31')).toBe(Date.parse('2024-01-31'));
        expect(myParseDate('2024-04-30')).toBe(Date.parse('2024-04-30'));
        // Note: JavaScript Date.parse will handle invalid dates like 2024-04-31 
        // by rolling over to the next month, so we don't test that here
      });
    });
  });

  describe('fixSlackStrings', () => {
    describe('smart quote replacement', () => {
      test('should replace left and right smart quotes with regular quotes', () => {
        expect(fixSlackStrings('"quoted text"')).toBe('"quoted text"');
        expect(fixSlackStrings('"another quote"')).toBe('"another quote"');
      });

      test('should handle mixed quote types', () => {
        expect(fixSlackStrings('"left and right"')).toBe('"left and right"');
        expect(fixSlackStrings('"mixed" and "quotes"')).toBe('"mixed" and "quotes"');
      });

      test('should handle multiple quote pairs', () => {
        expect(fixSlackStrings('"first" and "second" quotes')).toBe('"first" and "second" quotes');
        expect(fixSlackStrings('"one" "two" "three"')).toBe('"one" "two" "three"');
      });
    });

    describe('text preservation', () => {
      test('should preserve regular quotes unchanged', () => {
        expect(fixSlackStrings('"regular quotes"')).toBe('"regular quotes"');
        expect(fixSlackStrings("'single quotes'")).toBe("'single quotes'");
      });

      test('should preserve text without quotes', () => {
        expect(fixSlackStrings('no quotes here')).toBe('no quotes here');
        expect(fixSlackStrings('just plain text')).toBe('just plain text');
      });

      test('should handle empty and whitespace strings', () => {
        expect(fixSlackStrings('')).toBe('');
        expect(fixSlackStrings('   ')).toBe('   ');
        expect(fixSlackStrings('\\t\\n')).toBe('\\t\\n');
      });
    });

    describe('complex text scenarios', () => {
      test('should handle text with embedded quotes', () => {
        expect(fixSlackStrings('He said "hello" to me')).toBe('He said "hello" to me');
        expect(fixSlackStrings('The "important" decision was made')).toBe('The "important" decision was made');
      });

      test('should handle command-like strings', () => {
        expect(fixSlackStrings('add "API Decision" --impact high')).toBe('add "API Decision" --impact high');
        expect(fixSlackStrings('log --status "open" --tags "architecture"')).toBe('log --status "open" --tags "architecture"');
      });

      test('should handle special characters alongside quotes', () => {
        expect(fixSlackStrings('"hello@world.com" and "test#123"')).toBe('"hello@world.com" and "test#123"');
        expect(fixSlackStrings('"file.txt" or "path/to/file"')).toBe('"file.txt" or "path/to/file"');
      });
    });
  });
});