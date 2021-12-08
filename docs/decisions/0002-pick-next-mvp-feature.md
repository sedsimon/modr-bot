---
impact: low
reversibility: medium
status: committed
tags: 
  - product
review-by: "2022-01-01"
decide-by: "2021-11-25"
---
# Which feature should I build next on the MVP?

## Problem Description
Need to choose a next feature to work on.

## Drivers
The next feature should be:
- simple to build
- deliver incremental value
- address the discoverability problem

## Accepted Solution
Include problem description and accepted solution in Slack response. This will require solving the problem of parsing a Markdown file which is an important piece for other functionality. It also will improve discoverability by providing more context to the Slack reader. Relatively simple.

## Expected Outcome
Expect to provide more rich context to the reader in Slack. Don't expect it to take more than a day to implement.

## Trade-offs
It is not the next most valuable piece of functionality - this would probably be introducing the concept of impact. Solving this problem however will resolve some of the technical challenges associated with introducing the impact concept - parsing a Markdown file in particular.

## Considered Alternatives
1. Include problem description and Accepted Solution in body of slack message
    - shows some more valuable context right in slack which saves folks from having to click through to GitHub
    - not clear that it's meaningful added value
    - medium complexity - need to pull file content, parse MD and convert to slack block
    - solves an important techincal challenge - reading a markdown file from GitHub and parsing it
1. Allow creation of new decisions through slack
    - helpful for adoption but not related to discoverability problem
    - medium to high complexity - need to create branch / PR, create a file, add markdown content to file and commit.
1. set up deployment
    - medium - high complexity - need to find a place to host and choose a deployment method / implement. Also need to solve key management.
    - not related to discoverability
    - only useful once ready to share or start using regularly
1. pagination support
    - low / medium complexity - just need to figure out paginating in graphql and add next/prev elements to slack when needed
    - useful for discoverability when there are more than 10 adrs
    - no incremental value unless you have lots of adrs - which is not important right now
1. filter by impact / decide-by
    - valuable for discoverability - allows answering question "what upcoming important decisions are the team facing?"
    - medium complexity - need to parse .md files for impact and decide by

## People
**Decision Maker**: Simon Stanlake

**Consultants**:

**Approver**: Simon Stanlake
