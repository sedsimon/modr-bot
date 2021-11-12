const { App } = require("@slack/bolt");
require("dotenv").config();
// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN
});

// require the fs module that's built into Node.js
const fs = require('fs')
// get the raw data from the db.json file
let raw = fs.readFileSync('db.json');
// parse the raw bytes from the file as JSON
let decisions = JSON.parse(raw);

/*
 * returns an array of block elements representing a decision log entry
 * that can be individually written to response using message.blocks.push()
 */

function toBlockFormat(decision) {

  let block = [
    {
      type: "divider"
    },
  ];

  if(decision.problem) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Problem:* " + decision.problem,
      },
    });
  }

  block.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Decision:* " + (decision.decision || ""),
    },
  });

  if (decision.committed) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Committed:* " + decision.committed,
      },
    });
  }

  return block;
}

app.command("/decision", async ({ command, ack, say }) => {
    try {
      await ack();
      const resp = command.text.split(' ');
      switch(resp[0]) {
        case "log": // dump the entire decision log

          // Slack suggests use of a "text" element in case the message will
          // be printed to a system dialogue, or anywhere that block elements are
          // not supported
          let message = { blocks: [], text: "Decision Log" };

          // push a header block for the log
          message.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Decision Log*",
            },
          });

          // loop through JSON data pulled from database and for each decision
          // record create a new Slack block. Push the newly created block to the
          // message response
          decisions.data.map((decision) => {
            toBlockFormat(decision).forEach(block => {
              message.blocks.push(block);
            });
          });

          // write the message back to Slack
          say(message);
          break;

        case "start":
          say("creating a new in-progress decision");
          break;

        default:
          say("Yaaay! You made a decision!");
      }
    } catch (error) {
        console.log("err")
      console.error(error);
    }
});


(async () => {
  const port = 3000
  // Start your app
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
