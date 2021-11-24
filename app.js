const { Octokit } = require("octokit");
const { App } = require("@slack/bolt");
require("dotenv").config();

// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN
});

// establish github connection
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// returns the list of closed pull requests. These represent committed decisions
const closedPullRequests = `
{
  repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
    pullRequests(last: 10, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
      edges {
        node {
          closedAt
          title
        }
      }
    }
  }
}
`;

// returns the list of open pull requests. These represent active decision processes
const openPullRequests = `
{
  repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
    pullRequests(last: 10, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
      edges {
        node {
          title
          createdAt
        }
      }
    }
  }
}
`;

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
 * takes an `edge` object that resembles:
 * {
 *  node: {
 *    closedAt: dateTime,
 *    title: string
 *  }
 * }
 */
function toBlockFormat(edge) {

  const {node} = edge;
  let block = [
    {
      type: "divider"
    },
  ];

  if(node.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Problem:* " + node.title,
      },
    });
  }

  if (node.closedAt) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Committed:* " + node.closedAt.split('T')[0],
      },
    });
  }

  if (node.createdAt) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Opened:* " + node.createdAt.split('T')[0],
      },
    });
  }

  return block;
}

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
        let queryString = closedPullRequests;
        let logTitle = "*Committed Decisions*";
        if (resp[1] === "open") {
          queryString = openPullRequests;
          logTitle = "*Open Decisions*";
        }

        // push a header block for the log
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: logTitle,
          },
        });

        // `edges` is an array of node
        const {
         repository : {
           pullRequests : {
             edges
           }
         },
        } = await octokit.graphql(queryString);

        // loop through JSON data pulled from database and for each decision
        // record create a new Slack block. Push the newly created block to the
        // message response
        edges.map(edge => {
          toBlockFormat(edge).forEach(block => {
            message.blocks.push(block);
          });
        });

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
