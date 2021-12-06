import {getAdrFiles,getPullRequestsByFile} from './lib/adrs.js'

import bolt from "@slack/bolt";

const  { App } = bolt;


// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN
});

// usage instructions
const usage = `
Valid commands are: **log | help | start**
To list decisions: \`/decision log [open|committed]\`
To start a new decision: \`decision start <decision title>\`
To get help: \`decision help [command]\`
`

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

app.command("/decision", async ({ command, ack, say }) => {
  try {
    await ack();
    const resp = command.text.split(' ');

    // Slack suggests use of a "text" element in case the message will
    // be printed to a system dialogue, or anywhere that block elements are
    // not supported
    let message = { blocks: [], text: "" };
    switch(resp[0]) {

      case "log": {
        message.text = "Decision Log";
        let logTitle = "Committed Decisions";
        if (resp[1] === "open") {
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

        const adrFiles = await getAdrFiles();

        for (const adrFile of adrFiles) {

          // convert adr file to Slack block format and push it to the message body
        
          const blocks = toBlockFormat(adrFile);

          blocks.forEach(block => {
            message.blocks.push(block);
          });
            
        }

        break;
      }

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

    // write the message to Slack
    say(message);
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
