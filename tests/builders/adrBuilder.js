/**
 * Fluent builder for creating ADR test data
 *
 * Example usage:
 *   const adr = new AdrBuilder()
 *     .withTitle('API Design')
 *     .withStatus('open')
 *     .withImpact('high')
 *     .withTags(['api', 'architecture'])
 *     .build();
 */
export class AdrBuilder {
  constructor() {
    this.reset();
  }

  /**
   * Reset builder to default state
   * @private
   */
  reset() {
    this.adrData = {
      name: '0001-test-decision.md',
      githubUrl: 'https://github.com/test/repo/blob/main/docs/decisions/0001-test-decision.md',
      data: {
        frontmatter: {
          impact: 'medium',
          reversibility: 'low',
          status: 'open',
          tags: ['test'],
          'review-by': '2024-01-15',
          'decide-by': '2024-02-01'
        },
        title: 'Test Decision',
        'Problem Description': 'This is a test problem description.',
        'Accepted Solution': 'This is a test solution.'
      }
    };
  }

  /**
   * Set the ADR file name
   * @param {string} name - File name (e.g., '0001-api-design.md')
   * @returns {AdrBuilder}
   */
  withName(name) {
    this.adrData.name = name;
    return this;
  }

  /**
   * Set the GitHub URL
   * @param {string} url - Full GitHub URL to the ADR file
   * @returns {AdrBuilder}
   */
  withGithubUrl(url) {
    this.adrData.githubUrl = url;
    return this;
  }

  /**
   * Set the ADR title
   * @param {string} title - ADR title
   * @returns {AdrBuilder}
   */
  withTitle(title) {
    this.adrData.data.title = title;
    return this;
  }

  /**
   * Set the status
   * @param {string} status - Status value (e.g., 'open', 'committed', 'deferred', 'obsolete')
   * @returns {AdrBuilder}
   */
  withStatus(status) {
    this.adrData.data.frontmatter.status = status;
    return this;
  }

  /**
   * Set the impact level
   * @param {string} impact - Impact level ('high', 'medium', 'low')
   * @returns {AdrBuilder}
   */
  withImpact(impact) {
    this.adrData.data.frontmatter.impact = impact;
    return this;
  }

  /**
   * Set the reversibility level
   * @param {string} reversibility - Reversibility level ('high', 'medium', 'low')
   * @returns {AdrBuilder}
   */
  withReversibility(reversibility) {
    this.adrData.data.frontmatter.reversibility = reversibility;
    return this;
  }

  /**
   * Set tags
   * @param {string[]} tags - Array of tag strings
   * @returns {AdrBuilder}
   */
  withTags(tags) {
    this.adrData.data.frontmatter.tags = tags;
    return this;
  }

  /**
   * Set review-by date
   * @param {string} date - Review-by date (e.g., '2024-01-15')
   * @returns {AdrBuilder}
   */
  withReviewBy(date) {
    this.adrData.data.frontmatter['review-by'] = date;
    return this;
  }

  /**
   * Set decide-by date
   * @param {string} date - Decide-by date (e.g., '2024-02-01')
   * @returns {AdrBuilder}
   */
  withDecideBy(date) {
    this.adrData.data.frontmatter['decide-by'] = date;
    return this;
  }

  /**
   * Set committed-on date (typically used with status 'committed')
   * @param {string} date - Committed-on date (e.g., '2024-01-20')
   * @returns {AdrBuilder}
   */
  withCommittedOn(date) {
    this.adrData.data.frontmatter['committed-on'] = date;
    return this;
  }

  /**
   * Set the Problem Description section
   * @param {string} description - Problem description text
   * @returns {AdrBuilder}
   */
  withProblemDescription(description) {
    this.adrData.data['Problem Description'] = description;
    return this;
  }

  /**
   * Set the Accepted Solution section
   * @param {string} solution - Accepted solution text
   * @returns {AdrBuilder}
   */
  withAcceptedSolution(solution) {
    this.adrData.data['Accepted Solution'] = solution;
    return this;
  }

  /**
   * Set custom frontmatter properties
   * @param {Object} frontmatter - Object containing frontmatter properties
   * @returns {AdrBuilder}
   */
  withFrontmatter(frontmatter) {
    this.adrData.data.frontmatter = { ...this.adrData.data.frontmatter, ...frontmatter };
    return this;
  }

  /**
   * Set custom data properties
   * @param {Object} data - Object containing data properties
   * @returns {AdrBuilder}
   */
  withData(data) {
    this.adrData.data = { ...this.adrData.data, ...data };
    return this;
  }

  /**
   * Build and return the ADR data object
   * @returns {Object} Complete ADR data object
   */
  build() {
    const result = this.adrData;
    this.reset();
    return result;
  }

  /**
   * Create a minimal ADR with only required fields
   * @returns {Object} Minimal ADR data object
   */
  buildMinimal() {
    const minimal = {
      name: this.adrData.name,
      githubUrl: this.adrData.githubUrl,
      data: {
        frontmatter: {
          status: this.adrData.data.frontmatter.status
        },
        title: this.adrData.data.title
      }
    };
    this.reset();
    return minimal;
  }
}
