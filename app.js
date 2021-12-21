import {getAdrFiles,getPullRequestsByFile, createAdrFile} from './lib/adrs.js'
import {Command, InvalidArgumentError, Option} from "commander"
import bolt from "@slack/bolt";
import shlex from "shlex"
import moment from "moment"

const  { App } = bolt;

// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.SLACK_APP_TOKEN
});


/*
 * respond to a user clicking the "View PRs" button by opening a modal with
 * a list of PRs for that file.
 * 
 * action passes in the name of the file we are interested in
 */

app.action("list prs action", async({body, ack, client, action}) => {
  try {
    await ack();
    const fileName = action.value;

    // loop through the pull requests and organize them according to files changed.
    // pullRequestsByFile is a map of pull requests indexed by file
    const pullRequestsByFile = await getPullRequestsByFile();

    // get the pull requests for the file we're interested in
    const pullRequestsForFile = pullRequestsByFile[fileName];

    // create the modal object to display the pull requests
    let modal = {
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "modal_1",
        title: {
          type: "plain_text",
          text: "Pull Requests"
        },
        close: {
          type: "plain_text",
          text: "Close"
        },
      },
    };

    if (!pullRequestsForFile) {
      // if this file has no associated pull requests, inform the user
      // and return
      modal.view.blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${fileName} has no associated pull requests.`
          }
        },
      ];
    } else {
      
      modal.view.blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: fileName
          }
        },
        {
          type: "divider"
        },
      ];

      // loop through pull requests and add a row in the modal for each
      for (const pullRequest of pullRequestsForFile) {
        modal.view.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${pullRequest.url}|${pullRequest.title}>\n${pullRequest.body}`
          }
        });
        
        // keep this in for now, will add real data later
        modal.view.blocks.push({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Status: *${pullRequest.state}*`
            },
            {
              type: "mrkdwn",
              text: `Created: ${moment(Date.parse(pullRequest.createdAt)).format("YYYY-MM-DD")}`
            }
          ]
        });
      }
  
    } 

    // open the modal
    const result = await client.views.open(modal);

  } catch (error) {
    console.log("err")
    console.error(error);
  }
});

/*
 * look for a date of format yyyy-mm-dd and throw InvalidArgumetnError if none found
 */
function myParseDate(datestr) {
  const date_ms = Date.parse(datestr);
  if (isNaN(date_ms)) {
    throw new InvalidArgumentError("Error: unable to parse date " + datestr + ". Must be yyyy-mm-dd format.");
  }
  return date_ms;
}

/*
 * fix slack strings. Slack sends lots of pretty characters that confuse the command parser
 */

function fixSlackStrings(str) {
  return str.replace(/[\u201C\u201D]/g,'"');
}

/*
 * respond to the "/decision" slash command
 * push back info on all adrFiles that match the given set of options
 */

app.command("/decision", async ({ command, ack, respond }) => {
  try {
    await ack();

    // 'ephemeral' type means only the user calling the command will see the result
    let message = { blocks: [], text: "", response_type: "ephemeral" };

    const program = new Command();

    // by default commander calls process.exit if it finds an error or displays help.
    // override this behaviour
    program.exitOverride();

    // by default commander writes to stdout and stderr. Instead, capture these and send
    // back to slack as code blocks
    program
      .configureOutput({
        
        writeOut: (str) => {
          message.text = "Help Text";
          message.blocks.push( {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "```" + str + "```",
            }
          });
          respond(message);
        },
        writeErr: (str) => {
          message.text = "Help Text";
          message.blocks.push( {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "```" + str + "```",
            }
          });
          respond(message);
        },
        
      });

    const decisionCommand = program.name("/decision").description("A utility for working with ADRs.");
    
    decisionCommand.command("log")
      .description("List ADRs that match all of the given (optional) filters.")
      .addOption(new Option("-s, --status <status...>","Filter on ADR status.").choices(["open","committed","deferred","obsolete"]))
      .addOption(new Option("-i, --impact <impact...>","Filter on ADR Impact.").choices(["high","medium","low"]))
      .option("-ca, --committed-after <date>","Filter ADRs committed since the given date (yyyy-mm-dd format).",myParseDate)
      .option("-db, --decide-before <date>","Filter open ADRs that must be decided on before the given date (yyyy-mm-dd format).",myParseDate)
      .option("-t, --tags <tag...>","Filter on ADR tags.")
      .action(async (options,cmd) => {
        message.text = "Decision Log";
        
        const adrFiles = await getAdrFiles(options);

        for (const adrFile of adrFiles) {

          const blockFormatter = await import(process.env.ADR_TO_BLOCK_FORMATTER || "./lib/blockFormatter.js");

          // convert adr file to Slack block format and push it to the message body
          const blocks = blockFormatter.toBlockFormat(adrFile);

          blocks.forEach(block => {
            message.blocks.push(block);
          });  
        }
      });

    // make title and branch optional for now to aid debugging
    decisionCommand.command("add").description("Create a new ADR.")
      .option("-i, --impact <impact>","Set impact=<impact> in new ADR.","high")
      .option("-t, --title <title>","Set the title of the new ADR.","My new ADR title")
      .option("-b, --branch <branch>","Set the name of the new branch. This will also be used as the name of the associated pull request.","testing-branch")
      .action(async (options,cmd) => {
        const result = await createAdrFile(options);
        const rootUrl = `https://github.com/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}`;
        const adrUrl = `${rootUrl}/tree/${options.branch}/${result.adrFile}`;
        message.text = "Create ADR";
        message.response_type = "in_channel";
        message.blocks.push( {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${command.user_id}> created a new decision titled <${adrUrl}|${options.title}>.\nJoin the discussion on <${result.pullRequestUrl}|GitHub>`,
          }
        });
      });

    const argv = shlex.split(fixSlackStrings(command.text));
    await decisionCommand.parseAsync(argv,{from: "user"});

    // write the message to Slack
    respond(message);
  } catch (error) {
      console.log("err")
    console.error(error);
  }
});

(async () => {
  const port = 3000;
  // Start your app
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
