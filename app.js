import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'

import { Octokit } from "octokit";
import bolt from "@slack/bolt";
import dotenv from "dotenv";

const  { App } = bolt;


dotenv.config();


const adr_re = new RegExp(process.env.GITHUB_ADR_REGEX);

// Initializes app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN
});

// establish github connection
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// gets the contents of the adr directory
const adrContents = `
  {
    repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
      object(expression: "${process.env.GITHUB_DEFAULT_BRANCH}:${process.env.GITHUB_PATH_TO_ADRS}") {
        ... on Tree {
          entries {
            name
            object {
              ... on Blob {
                text
              }
            }
          }
          
        }
      }
    }
  }
  `;

// returns the list of closed pull requests. These represent committed decisions
const closedPullRequests = `
{
  repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
    pullRequests(last: 10, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
      edges {
        node {
          closedAt
          title
          url
          files(last: 10) {
            edges {
              node {
                path
              }
            }
          }
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
          url
          files (last: 10){
            edges {
              node {
                path
              }
            }
          }
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
 * takes an AST and a section header, and finds the associated text under that header.
 */

function adrToJSON(ast) {
  
  // 'children' is an array of markdown blocks, such as headers, paragraphs, lists etc
  const {children} = ast;

  let jsonObj = {};

  // the AST should start with the YAML frontmatter, and should have a title section next
  if (children.length > 1) {
    // get the title - this is at position [1] and has depth of 1
    jsonObj.title = children[1].children[0].value;
    
    // The next paragraph is the text we are after

    let i = 0;

    while (i < children.length) {
      if (children[i].type == "heading" && children[i].depth == 2) {
        // found a section header
        jsonObj[children[i].children[0].value] = children[i+1].children[0].value;
      }

      i++;
    }
  }
  return jsonObj;
}


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
async function toBlockFormat(adrFile) {

  const {fileName} = adrFile;

  const {object: {text}} = adrFile;

  // create an Abstract Syntax Tree (ast) by parsing the markdown file
  const adrAST = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(text);


  const adrJsonObj = adrToJSON(adrAST);

  let block = [
    {
      type: "divider"
    },
  ];

  // push the pull request title with a link to the pull request
  if(adrJsonObj.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Problem:* ${adrJsonObj.title}`,
      },
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
/*
  if (node.closedAt) {
    block.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "*Committed:* " + node.closedAt.split('T')[0],
        },
      ]
    });
  }

  if (node.createdAt) {
    block.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "*Opened:* " + node.createdAt.split('T')[0],
        },
      ]
    });
  }
*/
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
        let logTitle = "Committed Decisions";
        if (resp[1] === "open") {
          queryString = openPullRequests;
          logTitle = "Open Decisions";
        }

        // returns an array of adr files including contents
        const {
          repository : {
            object : {
              entries: adrFiles
            }
          },
         } = await octokit.graphql(adrContents);

        // push a header block for the log
        message.blocks.push({
          type: "header",
          text: {
            type: "plain_text",
            text: logTitle,
          },
        });

        // loop through list of adrFiles, format contents as Slack blocks and
        // push them to the message
        // since we use async calls in this loop, utilize arr.reduce(prev,curr)
        // to ensure they are resolved and return in order
        await adrFiles.reduce(async (prev, adrFile) => {

          // wait for the previous message to get pushed
          await prev;

          // only add the block to the response if someone changed an ADR
          if (adr_re.test(adrFile.name))
          {
            // if we find an adr file that is part of the pull request, convert it
            // to Slack block format and push it to the message body
          
            const blocks = await toBlockFormat(adrFile);

            blocks.forEach(block => {
              message.blocks.push(block);
            });
          }
            
        },undefined);

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
