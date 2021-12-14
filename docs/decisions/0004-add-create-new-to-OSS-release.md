---
impact: medium
reversibility: high
status: open
tags: 
  - product
review-by: "2022-01-01"
decide-by: "2022-12-16"
---
# Should we add Create New ADR to the OSS release?

## Problem Description
The current OSS release doesn't have a "Create New" feature. This closes the product off to teams not using ADRs. However adding it creates uncertainty - not sure how hard it is to do, and not sure if it will meaningfully impact uptake.

## Drivers
- want to have a great OSS release that people will engage with
- don't want to spend time building something that nobody wants

## Accepted Solution
Add the Create New feature.

## Expected Outcome
We expect the Create New feature will:
- be buildable in a couple days
- allow teams who don't use ADRs currently to start using them, enhancing the market for this product
- allow exploration and definition of useful processes for teams to adopt related to ADRs, which enhances value prop

## Trade-offs
- will take some extra time
- accepting some risk

## Considered Alternatives
1. No Create New feature
    * can focus on deployment and documentation
    * will restrict users to those who currently use ADRs
2. Add the Create New feature
    * will take a couple days minimum
    * makes the product appeal to teams not using ADRs
    * teams not using ADRs can benefit from some of the extra stuff ie: metadata - this is harder to adopt for teams that have already built their ADR process. In this way it makes sense to focus more on teams who do not use ADRs but are interested.
    * have an opportunity to coach teams on how to successfully use ADRs via processes we define

## People
**Decision Maker**: Simon Stanlake

**Consultants**:

**Approver**: Simon Stanlake
