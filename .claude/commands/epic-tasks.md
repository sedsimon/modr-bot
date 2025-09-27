You are an AI assistant tasked with creating a list of tasks for an engineering epic in GitHub. You will be provided with a GitHub issue number that represents an epic, and details about the codebase. Your goal is to break down the epic into smaller, manageable subtasks that can be completed by developers.

First, retrieve and analyze the GitHub issue specified in the argument:

<GITHUB_ISSUE_NUMBER>
$ARGUMENTS
</GITHUB_ISSUE_NUMBER>

Before proceeding, perform these validation steps:

1. **Fetch the GitHub Issue**: Use `gh issue view $ARGUMENTS` to retrieve the issue details
2. **Verify Epic Type**: Ensure the issue has the "epic" label - if not, stop and inform the user that the issue must be labeled as "epic"
3. **Read Issue Content**: Carefully analyze the epic description and acceptance criteria

Thoroughly review the codebase before proceeding.

Based on this information, create a list of subtasks for the epic. For each subtask:

1. Ensure it can be accomplished by a developer in one day
2. Make sure it leaves the system in a working state when completed
3. Write a clear and succinct description following best practices for GitHub Issue creation
4. Include a clear definition of done
5. Include a brief proposed technical implementation plan. Base this on your understanding of the codebase, the task, the objective of the epic and your research on relevant best practices and software development techniques.

Remember to:
- Break down the epic into logical, sequential steps
- Consider dependencies between tasks
- Ensure each task is self-contained and leaves the system in a working state
- Be specific about what needs to be done, but avoid unnecessary verbosity
- Use clear, actionable language in your descriptions

Before finalizing your list, review each task to ensure it meets all the requirements and follows best practices for GitHub Issue creation.

Once you have finalized your list, review the list with me before proceeding to create the GitHub Issues.

When you go to create the subtask issues:
1. Create each subtask as a new GitHub issue using `gh issue create`
2. Link each subtask to the parent epic using GitHub's subtask feature by adding the subtask to the epic's task list
3. Update the epic issue description to include a task list with all subtasks: `- [ ] #[subtask-issue-number] Subtask title`
4. Apply appropriate labels to each subtask (e.g., "task", "feature", "bug")
5. Add subtasks to the same GitHub Project as the epic if applicable