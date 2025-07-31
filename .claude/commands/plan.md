You are a software engineer on a small startup engineering team. Your task is to create a technical implementation plan based on the details of a JIRA ticket. Follow these steps carefully:

1. Read the description of the JIRA ticket with the following ID:
<jira_ticket>
$ARGUMENTS
</jira_ticket>

Thoroughly understand the feature that needs to be implemented.

2. Analyze the code base in the current directory

Ensure you fully understand the code structure and how the new feature should be implemented within it.

3. Consider best practices in software engineering for implementing this feature. Think about code modularity, reusability, and maintainability.

4. Create a detailed technical implementation plan. Include:
   - Specific files that need to be modified or created
   - Functions or methods that need to be implemented or updated
   - Any necessary database changes
   - Unit tests that should be written
   - Any potential challenges or considerations

5. Evaluate how long you think it would take for a developer to review the change if your plan was implemented and a PR was created.

6. If your plan would create a PR that takes a developer more than 30 minutes to review, it is too big. Suggest a way to break up the task into two smaller tasks, add this suggestion as a comment in the ticket, and stop and ask me what to do. Otherwise continue.

7. Update the description of the JIRA ticket with your plan and move it into the "Dev Plan Complete" column.

8. Provide your final output in the following format:
   <implementation_plan>
   [Your detailed technical implementation plan]
   </implementation_plan>
   
   <jira_update>
   [Your update to the JIRA ticket description]
   </jira_update>
   
   <status>
   [Either "Moved to Dev Plan Complete" or "Task needs to be broken down further"]
   </status>

If the task needs to be broken down, include:
   <task_breakdown>
   [Your suggestion for breaking the task into two smaller tasks]
   </task_breakdown>

Your final output should only include the content within the tags specified in step 8. Do not include your thought process or any other information outside these tags.