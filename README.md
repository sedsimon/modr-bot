# modr-bot
Slack bot to simplify creation and retrieval of Architectural Decision Records (ADRs) from a GitHub repo.

`modr` stands for Markdown Organizational Decision Record - a riff on Architectural Decision Record which hints that, just maybe, we should be making a record of all decisions, not just architecture ones.

## introduction
- why modr-bot was created
- who is it for
- what IRL practices will help you get the most out of modr-bot

## how to use it

When `modr-bot` is properly installed in your Slack workspace, it enables the `/decision` slash command. This command accepts the following subcommands:

```
/decision log [options]

List ADRs that match all of the given (optional) filters.

Options:
  -s, --status <status...>       Filter on ADR status. (choices: "open", "committed", "deferred", "obsolete")
  -i, --impact <impact...>       Filter on ADR Impact. (choices: "high", "medium", "low")
  -ca, --committed-after <date>  Filter ADRs committed since the given date (yyyy-mm-dd format).
  -db, --decide-before <date>    Filter open ADRs that must be decided on before the given date (yyyy-mm-dd format).
  -t, --tags <tag...>            Filter on ADR tags.
  -h, --help                     display help for command

```
```
/decision add [options]

create a new ADR in the repo on a new branch and create a pull request for collaboration.

Options:
  -i, --impact <impact>  Set impact=<impact> in new ADR. (choices: "high", "medium", "low", default: "medium")
  -t, --title <title>    Set the title of the new ADR. This will also be used as the name of the associated pull request.
  -b, --branch <branch>  Set the name of the new branch.
  -h, --help             display help for command
  ```

## How to install it
- create a slack app
- create the slash command
- create the github key
- create the env file

## what's next