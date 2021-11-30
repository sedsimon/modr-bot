import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'

import { Octokit } from "octokit";
import bolt from "@slack/bolt";
import dotenv from "dotenv";

const  { App } = bolt;


dotenv.config();


const adr_re = new RegExp(process.env.GITHUB_PATH_TO_ADRS
  + "/"
  + process.env.GITHUB_ADR_REGEX);

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

function getSectionText(ast,sectionHeader) {
  
  // 'children' is an array of markdown blocks, such as headers, paragraphs, lists etc
  const {children} = ast;

  // look for a heading at depth 2 with title matching sectionHeader.
  // The next paragraph is the text we are after

  let i = 0;
  let pos = -1;
  while (pos < 0 && i < children.length) {
    if (children[i].type == "heading" && children[i].depth == 2
    && children[i].children[0].value == sectionHeader) {

      // if we find a match, the next object is the paragraph we are after
      pos = i + 1;
    }
    i++;
  }

  if (pos > 0) {

    // the content of the paragraph is in a 'children' sub-element
    return children[pos].children[0].value;
  }
}


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
async function toBlockFormat(edge, path) {

  // edge represents a pull request
  const {node} = edge;

  const pathExpr =
    process.env.GITHUB_DEFAULT_BRANCH + ":" + path;

  const adrContents = `
  {
    repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
      object(expression: "${pathExpr}") {
        ... on Blob {
          text
        }
      }
    }
  }
  `;

  // get the file contents from github
  const {
   repository : {
     object : {
       text
     }
   },
  } = await octokit.graphql(adrContents);

  // create an Abstract Syntax Tree (ast) by parsing the markdown file
  const fileContents = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(text);

  const problemStatement = getSectionText(fileContents,"Problem Description");
  const acceptedSolution = getSectionText(fileContents,"Accepted Solution");

  let block = [
    {
      type: "divider"
    },
  ];

  // push the pull request title with a link to the pull request
  if(node.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Problem:* <${node.url}|${node.title}>`,
      },
    });
  }



  if(problemStatement) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: problemStatement,
      },
    });
  }

  if(acceptedSolution) {
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
        text: acceptedSolution,
      },
    });

  }

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

        // push a header block for the log
        message.blocks.push({
          type: "header",
          text: {
            type: "plain_text",
            text: logTitle,
          },
        });

        // `edges` is an array of node objects
        // each node object represents a pull request
        const {
         repository : {
           pullRequests : {
             edges
           }
         },
        } = await octokit.graphql(queryString);

        // loop through JSON data pulled from github
        // since we use async calls in this loop, utilize arr.reduce(prev,curr)
        // to ensure they are resolved and return in order
        await edges.reduce(async (prev, edge) => {

          // wait for the previous message to get pushed
          await prev;

          // check for existence of a changed file that matches adr_re regex
          let {
            node: {
              files: {
                edges: changedFiles
              }
            }
          } = edge;

          let adrFile = null;
          // loop through files looking for ADRs
          changedFiles.some(changedFile => {
            let { node: file } = changedFile;
            // only add the block to the response if someone changed an ADR
            if (adr_re.test(file.path))
            {
              adrFile = file.path;
              return true;
            }
          });

          // if we find an adr file that is part of the pull request, convert it
          // to Slack block format and push it to the message body
          if (adrFile) {

            const blocks = await toBlockFormat(edge,adrFile);

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
