import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import YAML from 'yaml'

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
const getPullRequests = `
{
  repository(name: "${process.env.GITHUB_REPO}", owner: "${process.env.GITHUB_USER}") {
    pullRequests(last: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
      edges {
        node {
          closedAt
          title
          body
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


// usage instructions
const usage = `
Valid commands are: **log | help | start**
To list decisions: \`/decision log [open|committed]\`
To start a new decision: \`decision start <decision title>\`
To get help: \`decision help [command]\`
`

/*
 * takes response from github graphql and returns an object
 * who's keys are file names and values are arrays containing
 * the pull requests in which the file got changed
 * 
 * pullRequest is an array of edge objects. Each edge has a node which contains the pull request information
 */

function getPullRequestsByFile(pullRequests) {
  let pullRequestsByFile = {};

  for (const pr_edge of pullRequests) {
    
    const pullRequest = {
      title: pr_edge.node.title,
      url: pr_edge.node.url,
      body: pr_edge.node.body
    };

    for (const file_edge of pr_edge.node.files.edges) {
      const filePath = file_edge.node.path;
      if (!pullRequestsByFile[filePath]){
        pullRequestsByFile[filePath] = [];
      }
      pullRequestsByFile[filePath].push(pullRequest);
    }
  }

  return pullRequestsByFile;
}

/*
 * takes an AST and a section header, and finds the associated text under that header.
 */

function adrToJSON(ast) {
  
  // 'children' is an array of markdown blocks, such as headers, paragraphs, lists etc
  const {children} = ast;

  let jsonObj = {};

  // look for YAML frontmatter
  if (children[0].type == "yaml") {
    jsonObj.frontmatter = YAML.parse(children[0].value);
  }

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

  const {name: fileName} = adrFile;

  const githubUrlForFile = "https://github.com/"
    + process.env.GITHUB_USER + "/" + process.env.GITHUB_REPO
    + "/blob/" + process.env.GITHUB_DEFAULT_BRANCH
    + "/" + process.env.GITHUB_PATH_TO_ADRS + "/" + fileName;


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

  // push the adr title
  if(adrJsonObj.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Problem:* <${githubUrlForFile}|${adrJsonObj.title}>`,
      },
			accessory: {
				type: "button",
				text: {
					type: "plain_text",
					text: "List PRs",
				},
				value: fileName,
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
    const fileName = process.env.GITHUB_PATH_TO_ADRS + "/" + action.value;

    // get a list of all the pull requests for the repo (ouch)
    const {
      repository : {
        pullRequests : {
          edges : allPullRequests
        }
      }
    } = await octokit.graphql(getPullRequests);

    // loop through the pull requests and organize them according to files changed.
    // pullRequestsByFile is a map of pull requests indexed by file
    const pullRequestsByFile = getPullRequestsByFile(allPullRequests);

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
