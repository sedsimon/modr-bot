---
status: WIP
created: 2021-12-15
ADR: <link to associated ADR/>
---

# Process for creating new ADRs

## Background
We use the GitHub branch/pull request model to collaborate on new decisions. In order to capture the relevant context as an ADR is created, we need a standard process for adding new ADRs. Without this, it's not clear where to look for context when reviewing ADRs.

Further, we need a process to model our tool on.

## Proposal
The following process for ADR creation is lightweight enough to make it easy while still capturing the essential data points and making it obvious where to look for context.

## Steps
1. create a new branch from `main` with a short, descriptive name for the decision.
1. make a copy of the `decision-template.md` file and rename it `nnnn-<decision-name>.md` where `nnnn` is the incremental decision index and <decision-name> is a short descriptive name for the decision.
1. update **at least** the following sections in the new ADR:
    * `status=open`
    * update the `Title` to reflect the decision
1. commit and push the branch to `origin`
1. create a PR for your branch with a descriptive title. This is where collaboration happens and is essential to recording context.

After completing the above the team will have an active decision record they can collaborate on and record context.