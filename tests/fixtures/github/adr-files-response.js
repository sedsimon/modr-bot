// Mock GitHub GraphQL response for ADR files query
export const adrFilesGraphQLResponse = {
  repository: {
    object: {
      entries: [
        {
          name: "0001-test-adr-open.md",
          object: {
            text: `---
impact: high
reversibility: medium
status: open
tags: 
  - architecture
  - api
review-by: "2024-01-15"
decide-by: "2024-02-01"
---
# API Design Pattern for Data Access

## Problem Description
We need to establish a consistent pattern for accessing data across our microservices architecture.

## Accepted Solution
Implement a standardized GraphQL API gateway pattern with service-specific resolvers.`
          }
        },
        {
          name: "0002-test-adr-committed.md",
          object: {
            text: `---
impact: medium
reversibility: low
status: committed
tags: 
  - infrastructure
  - deployment
decide-by: "2023-12-01"
---
# Container Orchestration Platform

## Problem Description
Our current deployment process is manual and error-prone.

## Accepted Solution
Adopt Kubernetes as our container orchestration platform with Helm for package management.`
          }
        },
        {
          name: "0003-test-adr-deferred.md",
          object: {
            text: `---
impact: low
reversibility: high
status: deferred
tags: 
  - performance
  - monitoring
review-by: "2024-06-01"
---
# Real-time Performance Monitoring

## Problem Description
We lack comprehensive real-time monitoring of application performance metrics.

## Accepted Solution
This decision has been deferred pending budget approval for Q2 2024.`
          }
        },
        {
          name: "non-adr-file.txt",
          object: {
            text: "This is not an ADR file and should be filtered out"
          }
        }
      ]
    }
  }
};

// Mock GitHub REST API response for branch creation
export const createBranchResponse = {
  ref: "refs/heads/feature/new-adr-test",
  node_id: "MDM6UmVmMTMzOTI2MTQ6cmVmcy9oZWFkcy9mZWF0dXJlL25ldy1hZHItdGVzdA==",
  url: "https://api.github.com/repos/test-user/test-repo/git/refs/heads/feature/new-adr-test",
  object: {
    sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
    type: "commit",
    url: "https://api.github.com/repos/test-user/test-repo/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd"
  }
};

// Mock GitHub REST API response for file creation
export const createFileResponse = {
  content: {
    name: "0006-new-test-adr.md",
    path: "docs/decisions/0006-new-test-adr.md",
    sha: "95b966ae1c166bd92f8ae7d1c313e738c731dfc3",
    size: 362,
    url: "https://api.github.com/repos/test-user/test-repo/contents/docs/decisions/0006-new-test-adr.md?ref=feature/new-adr-test",
    html_url: "https://github.com/test-user/test-repo/blob/feature/new-adr-test/docs/decisions/0006-new-test-adr.md",
    git_url: "https://api.github.com/repos/test-user/test-repo/git/blobs/95b966ae1c166bd92f8ae7d1c313e738c731dfc3",
    download_url: "https://raw.githubusercontent.com/test-user/test-repo/feature/new-adr-test/docs/decisions/0006-new-test-adr.md",
    type: "file"
  },
  commit: {
    sha: "7638417db6d59f3c431d3e1f261cc637155684cd",
    node_id: "MDY6Q29tbWl0MTMzOTI2MTQ6NzYzODQxN2RiNmQ1OWYzYzQzMWQzZTFmMjYxY2M2MzcxNTU2ODRjZA==",
    url: "https://api.github.com/repos/test-user/test-repo/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd"
  }
};

// Mock GitHub REST API response for PR creation
export const createPullRequestResponse = {
  id: 1,
  number: 42,
  html_url: "https://github.com/test-user/test-repo/pull/42",
  title: "Add new ADR: Test Decision",
  body: "This PR adds a new Architectural Decision Record for testing purposes.",
  state: "open",
  head: {
    ref: "feature/new-adr-test",
    sha: "7638417db6d59f3c431d3e1f261cc637155684cd"
  },
  base: {
    ref: "main",
    sha: "aa218f56b14c9653891f9e74264a383fa43fefbd"
  }
};