import {getAdrFiles,getPullRequestsByFile} from './lib/adrs.js'
import {Command, InvalidArgumentError, Option} from "commander"
import bolt from "@slack/bolt";
import {split} from "shlex"

const  { App } = bolt;

// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.SLACK_APP_TOKEN
});

/*
 * returns an array of block elements representing a decision log entry
 * that can be individually written to response using message.blocks.push().
 *
 * takes an `adrFile` object that resembles:
 * {
 *  name: <filename>,
 *  object: {
 *    text: <file contents>
 *  }
 * }
 */
function toBlockFormat(adrFile) {

  let block = [
    {
      type: "divider"
    },
  ];

  const adrJsonObj = adrFile.data;

  // push the adr title
  if(adrJsonObj.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Problem:* <${adrFile.githubUrl}|${adrJsonObj.title}>`,
      },
			accessory: {
				type: "button",
				text: {
					type: "plain_text",
					text: "List PRs",
				},
				value: adrFile.name,
				action_id: "list prs action"
			}
    });
  }

  if(adrJsonObj["Problem Description"]) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: adrJsonObj["Problem Description"],
      },
    });
  }

  if(adrJsonObj["Accepted Solution"]) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Accepted Solution*",
      },
    });


    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: adrJsonObj["Accepted Solution"],
      },
    });

  }

  // if there is frontmatter, add that as a Context block in slack message
  if (adrJsonObj.frontmatter && (
    adrJsonObj.frontmatter.status
    || adrJsonObj.frontmatter.committed
    || adrJsonObj.frontmatter["decide-by"]
    || adrJsonObj.frontmatter["review-by"])
    ) {
    
    // create reader friendly versions of the frontmatter properties
    const labels = {
      status: "Status",
      committed: "Committed On",
      "decide-by": "Decide By",
      "review-by": "Review By"
    };
    
    const elements = [];
    for (const property in labels) {
      
      // add a context element if there is a matching property in the frontmatter
      if (adrJsonObj.frontmatter[property]) {
        elements.push(
          {
            type: "mrkdwn",
            text: `*${labels[property]}*: ${adrJsonObj.frontmatter[property]}`,            
          }
        );
      }
    }
    block.push({
      type: "context",
      elements: elements
    });
  }

  return block;
}

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
        blocks: [
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
        ]
      },
    };

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
            text: "Status: *OPEN*"
          },
          {
            type: "mrkdwn",
            text: "Created: 2021-11-01"
          }
        ]
      });
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

function checkFilter(frontmatter, options) {

  // if no options passed, accept everything
  if (Object.keys(options).length === 0) {return true;}

  // if options are passed and there's no frontmatter, skip it
  if (!frontmatter) {return false;}

  // if status is specified look for a match
  if (options.status && !options.status.includes(frontmatter.status)) {
    return false;
  }

  // if impact is specified look for a match
  if (options.impact && !options.impact.includes(frontmatter.impact)) {
    return false;
  }

  // if committed-after is specified, filter ADRs that have an earlier committed-on
  if (options.committedAfter){
    const committed_on = Date.parse(frontmatter["committed-on"])
    if (isNaN(committed_on) || options.committedAfter > committed_on) {
      return false;
    }
  }

  // if decide-before is specified, filter ADRs that have a later decide-by
  if (options.decideBefore){
    
    // status must be "open"
    if (frontmatter.status != "open"){
      return false;
    }

    const decide_by = Date.parse(frontmatter["decide-by"])
    if (isNaN(decide_by) || options.decideBefore < decide_by) {
      return false;
    }
  }
  // if tags are specified, look for a match among the list of tags
  if (options.tags) {
     for (const tag of options.tags) {
       if (frontmatter.tags.includes(tag)) {
         return true;
       }
     }
     return false;
  }

  return true;

}

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

    program.name("/decision").command("log")
      .description("List ADRs that match all of the given (optional) filters.")
      .addOption(new Option("-s, --status <status...>","Filter on ADR status.").choices(["open","committed","deferred","obsolete"]))
      .addOption(new Option("-i, --impact <impact...>","Filter on ADR Impact.").choices(["high","medium","low"]))
      .option("-ca, --committed-after <date>","Filter ADRs committed since the given date (yyyy-mm-dd format).",myParseDate)
      .option("-db, --decide-before <date>","Filter open ADRs that must be decided on before the given date (yyyy-mm-dd format).",myParseDate)
      .option("-t, --tags <tag...>","Filter on ADR tags.")
      .action(async (options,command) => {
        message.text = "Decision Log";
        let logTitle = "Committed Decisions";
        if (options.status == "open") {
          logTitle = "Open Decisions";
        }
        // push a header block for the log
        message.blocks.push({
          type: "header",
          text: {
            type: "plain_text",
            text: logTitle,
          },
        });

        const adrFiles = await getAdrFiles(options);

        for (const adrFile of adrFiles) {

          if (checkFilter(adrFile.data.frontmatter,options)) {
            // convert adr file to Slack block format and push it to the message body
          
            const blocks = toBlockFormat(adrFile);

            blocks.forEach(block => {
              message.blocks.push(block);
            });

          }
            
        }
      });      

      await program.parseAsync(split(command.text),{from: "user"});

/*
      case "start": {
        message.text = "Creating a new in-progress decision.";
        break;
      }

      default: {
        message.text = "Help Text";
        message.blocks.push( {
          type: "section",
          text: {
            type: "mrkdwn",
            text: usage,
          }
        });
      }
    }
*/
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
