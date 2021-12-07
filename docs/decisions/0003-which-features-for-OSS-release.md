---
impact: medium
reversibility: medium
status: committed
tags: 
  - product
review-by: "2022-01-01"
decide-by: "2021-12-07"
committed-on: "2021-12-06"
---
# Which features should I include in the OSS release?

## Problem Description
I am driving towards releasing an OSS version of the Slack app. I need to decide what feature set to include that will give highest likelihood of helping to learn with corresponding minimal effort.

## Drivers
- Finished product needs to be usable, deployable, secure
- Should provide something an existing team can use with their ADRs
- Should provide an easy way for teams to get started with ADRs
- Should feel confident showing it to someone
- Needs to clearly address a problem - ie: discoverability

## Accepted Solution
1. be deployable to prod
1. pagination through large ADR sets
1. customize templates
1. filter by status, impact, committed-on, decide-by, tags
1. documentation for installing
1. documentation for how to get started with ADRs
1. Slack app to marketplace

## Expected Outcome
Will have a product I can show to people and collect feedback on. Will be usable by some teams.

## Trade-offs
- Will not have a way to create a new ADR which will be a problem for new teams.
- performance will be degraded due to large / many calls to github

## Considered Alternatives
1. be deployable to prod
1. pagination through large ADR sets
1. customize templates
1. filter by status, impact, committed-on, decide-by, tags
1. create new ADR
1. caching of results from github
1. documentation for installing
1. Slack app to marketplace
1. Documentation for how to get started with ADRs

## People
**Decision Maker**: Simon Stanlake

**Consultants**:

**Approver**: Simon Stanlake
