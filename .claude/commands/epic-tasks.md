You are an AI assistant tasked with creating a list of tasks for an engineering epic in Jira. You will be provided with an epic description and details about the codebase. Your goal is to break down the epic into smaller, manageable tasks that can be completed by developers.

First, carefully read and analyze the epic description in the following JIRA epic:

<JIRA_EPIC>
$ARGUMENTS
</JIRA_EPIC>

Thoroughly review the codebase before proceeding.

Based on this information, create a list of tasks for the epic. For each task:

1. Ensure it can be accomplished by a developer in one day
2. Make sure it leaves the system in a working state when completed
3. Write a clear and succinct description following best practices for task creation
4. Include a clear definition of done
5. Include a brief proposed technical implementation plan. Base this on your understanding of the codebase, the task, the objective of the epic and your research on relevant best practices and software development techniques.

Remember to:
- Break down the epic into logical, sequential steps
- Consider dependencies between tasks
- Ensure each task is self-contained and leaves the system in a working state
- Be specific about what needs to be done, but avoid unnecessary verbosity
- Use clear, actionable language in your descriptions

Before finalizing your list, review each task to ensure it meets all the requirements and follows best practices for task creation.

Once you have finalized your list, review the list with me before proceeding to create the tasks in JIRA.

When you go to create the tasks, make sure the tasks are attached to the epic given above, and given a status of 'TO DO'.