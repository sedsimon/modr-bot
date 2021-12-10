import { Octokit } from "octokit";
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import YAML from 'yaml'

// establish github connection
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const adr_re = new RegExp(process.env.GITHUB_ADR_REGEX);
const fullPathAdr_re = new RegExp(process.env.GITHUB_PATH_TO_ADRS + "/" + process.env.GITHUB_ADR_REGEX);
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

// returns the list of pull requests.
const getPullRequests = `
query ($repo:String!, $owner:String!, $cursor:String, $pageSize:Int!) {
  repository(name: $repo, owner: $owner) {
    pullRequests(last: $pageSize, before: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
      edges {
        node {
          closedAt
          title
          body
          url
          files(last: 100) {
            edges {
              node {
                path
              }
            }
          }
        }
      },
      pageInfo {
        hasPreviousPage,
        startCursor
      }
    }
  }
}
`;

export async function getAdrFiles() {

  let adrFiles = [];
  // returns an array of adr files including contents
  const {
    repository : {
      object : {
        entries: adrFilesRaw
      }
    },
  } = await octokit.graphql(adrContents);

  // since we use async calls in this loop, utilize arr.reduce(prev,curr)
  // to ensure they are resolved and return in order
  await adrFilesRaw.reduce(async (prev,adrFileRaw) => {

    await prev;

    const {name: fileName} = adrFileRaw;

    // only add the block to the response if someone changed an ADR
    if (adr_re.test(fileName))
    {
      let adrEntry = {};
      adrEntry.name = fileName;

      adrEntry.githubUrl = "https://github.com/"
      + process.env.GITHUB_USER + "/" + process.env.GITHUB_REPO
      + "/blob/" + process.env.GITHUB_DEFAULT_BRANCH
      + "/" + process.env.GITHUB_PATH_TO_ADRS + "/" + fileName;

      const {object: {text}} = adrFileRaw;

      // create an Abstract Syntax Tree (ast) by parsing the markdown file
      const adrAST = await unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .parse(text);
    
    
      adrEntry.data = adrToJSON(adrAST);
    
      adrFiles.push(adrEntry);

    } 
  
  },undefined);

  return adrFiles;
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
 * takes response from github graphql and returns an object
 * who's keys are file names and values are arrays containing
 * the pull requests in which the file got changed
 * 
 * allPullRequests is an array of edge objects. Each edge has a node which contains the pull request information
 */

export async function getPullRequestsByFile() {

  let pullRequestsByFile = {};

  // initialize query params
  const pageSize = 2;
  let startCursor = null;
  let hasPreviousPage = true;

  // paginate through list of pull requests, in descending order
  // of most recently updated
  while (hasPreviousPage) {
    const {
      repository : {
        pullRequests : {
          edges : allPullRequests,
          pageInfo 
        }
      }
    } = await octokit.graphql(
      getPullRequests,
      {
        cursor: startCursor,
        pageSize: pageSize,
        owner: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO
      });

    for (const pr_edge of allPullRequests) {
      
      // store info for the pull request
      const pullRequest = {
        title: pr_edge.node.title,
        url: pr_edge.node.url,
        body: pr_edge.node.body
      };

      // loop through changed files for the pull request
      for (const file_edge of pr_edge.node.files.edges) {
        const filePath = file_edge.node.path;

        // check to see if this file is an ADR
        // if not, skip it
        if(fullPathAdr_re.test(filePath)){

          const fileName = filePath.split('/').pop();
          
          // if we have not seen this file before, add it to the result map.
          if (!pullRequestsByFile[fileName]){
            pullRequestsByFile[fileName] = [];
          }

          // add pull request to the list of pull requests for this file
          pullRequestsByFile[fileName].push(pullRequest);
        }
      }

    }
    // set pagination variables
    startCursor = pageInfo.startCursor;
    hasPreviousPage = pageInfo.hasPreviousPage;
  }

  return pullRequestsByFile;
}
