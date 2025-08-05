---
impact: high
reversibility: low
status: committed
tags: 
  - architecture
  - testing
committed-on: "2024-01-15"
review-by: "2023-12-01"
decide-by: "2023-12-15"
---
# Date Filtering Test ADR

## Problem Description
This ADR is specifically designed to test date-based filtering functionality. It has various date fields set to specific values for testing purposes.

## Drivers
* Test committedAfter filtering
* Validate date parsing logic
* Ensure proper date comparison

## Accepted Solution
Use this ADR as a test fixture for date-based filtering operations.

## Expected Outcome
Date filtering tests will pass consistently with predictable date values.

## Trade-offs
* This is a test fixture, not a real decision
* Dates are set to specific values for testing

## People
**Decision Maker**: Test Suite

**Consultants**: Test Framework

**Approver**: CI/CD Pipeline