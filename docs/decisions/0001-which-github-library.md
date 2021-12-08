---
impact: low
reversibility: low
status: committed
decide-by: "2022-11-23"
---
# Which github library should we use to connect to APIs?

## Problem Description
We need a library to access github api. There are several options available.

## Drivers

* Needs to be well supported
* Should be easy to use

## Accepted Solution

[octokit.js from github](https://github.com/octokit/octokit.js) is the all included officially supported client for github

## Expected Outcome
Will allow me to successfully access the github api and will have the functionality I need if I'm going to continue

## Trade-offs
This API client has a lot of stuff I may not end up needing.

## Considered Alternatives
1. [octokit.js](https://github.com/octokit/octokit.js)
1. [@octokit/graphql](https://github.com/octokit/graphql.js)
1. [@octokit/rest](https://github.com/octokit/rest.js/)

## People
**Decision Maker**: Simon Stanlake

**Consultants**:

**Approver**: Simon Stanlake
