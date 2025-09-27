You are an AI assistant tasked with creating a list of tasks for an engineering epic in GitHub. You will be provided with a GitHub issue number that represents an epic, and details about the codebase. Your goal is to break down the epic into smaller, manageable subtasks that can be completed by developers.

First, retrieve and analyze the GitHub issue specified in the argument:

<GITHUB_ISSUE_NUMBER>
$ARGUMENTS
</GITHUB_ISSUE_NUMBER>

Before proceeding, perform these validation steps:

1. **Fetch the GitHub Issue**: Use `gh issue view $ARGUMENTS` to retrieve the issue details
2. **Verify Epic Type**: Ensure the issue is properly set up as an epic in the GitHub Project (Type field = "Epic") - if not, stop and inform the user that the issue must have Type set to "Epic" in the project
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
1. **Create each subtask** as a new GitHub issue using `gh issue create`
2. **Add to GitHub Project**: Add each subtask to the same project as the epic using `gh project item-add`
3. **Set Type field to Task**: Use GitHub API to find the "Type" field and set it to "Task" value for each subtask
4. **Set Status to Todo**: Use GitHub API to find the "Status" field and set it to "Todo" value for each subtask
5. **Update epic task list**: Update the epic issue description to include a task list with all subtasks: `- [ ] #[subtask-issue-number] Subtask title`
6. **Create the parent/child relationship**: Set the epic as the new task's parent using GitHub's `addSubIssue` mutation

## Field Management Process
- Use GraphQL API to discover field IDs and option IDs dynamically
- Look for field with name "Type" and find option with name "Task"
- Look for field with name "Status" and find option with name "Todo"
- Use `gh project item-edit` with the discovered IDs to set field values