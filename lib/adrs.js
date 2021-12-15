import { Octokit } from "octokit";
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'

// establish github connection
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const adr_re = new RegExp(process.env.GITHUB_ADR_REGEX);
const fullPathAdr_re = new RegExp(process.env.GITHUB_PATH_TO_ADRS + "/" + process.env.GITHUB_ADR_REGEX);
// gets the contents of the adr directory
const adrContents = `
  query ($repo: String!, $owner: String!, $adr_ref: String!)
  {
    repository(name: $repo, owner: $owner) {
      object(expression: $adr_ref) {
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

/*
 * get the list of ADR files given the search expression represented by
 * GITHUB_PATH_TO_ADRS,
 * GITHUB_DEFAULT_BRANCH,
 * GITHUB_ADR_RE (regular expression to match ADR files)
 * ie: "main:docs/decisions/nnnn-[word]+.md"
 * 
 * filter the list according to the options passed
 */

export async function getAdrFiles(options) {

  let adrFiles = [];
  // returns an array of adr files including contents
  const {
    repository : {
      object : {
        entries: adrFilesRaw
      }
    },
  } = await octokit.graphql(
    adrContents,
    {
      owner: process.env.GITHUB_USER,
      repo: process.env.GITHUB_REPO,
      adr_ref: `${process.env.GITHUB_DEFAULT_BRANCH}:${process.env.GITHUB_PATH_TO_ADRS}`
    }
  );

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
    
      const parser = await import(process.env.ADR_PARSER || "./adrParser.js");
      adrEntry.data = parser.adrToJSON(adrAST);
    
      if (checkFilter(adrEntry.data.frontmatter,options)){
        adrFiles.push(adrEntry);
      }

    } 
  
  },undefined);

  return adrFiles;
}

/*
 * given some YAML frontmatter and a list of options, determine whether
 * the frontmatter matches
 * Options are:
 *  - status (array): one or more of committed, open, deferred, obsolete
 *  - tags (array)
 *  - committedAfter (date): match if committed-on date is after committedAfter
 *  - decideBefore (date): match if decide-by is before decideBefore AND status = OPEN
 *  - impact (array): one or more of high, medium, low
 */

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
          state
          createdAt
          files(last: $pageSize) {
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

/*
 * takes response from github graphql and returns an object
 * who's keys are file names and values are arrays containing
 * the pull requests in which the file got changed
 * 
 */

export async function getPullRequestsByFile() {

  let pullRequestsByFile = {};

  // initialize query params
  const pageSize = 100;
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

    // allPullRequests is an array of edge objects.
    // Each edge has a node which contains the pull request information
    for (const pr_edge of allPullRequests) {
      
      // store info for the pull request
      const pullRequest = {
        title: pr_edge.node.title,
        url: pr_edge.node.url,
        body: pr_edge.node.body,
        createdAt: pr_edge.node.createdAt,
        state: pr_edge.node.state
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

/*
 * createAdrFile(options)
 */

export async function createAdrFile(options) {
  return `I created ${options.title} for you on branch ${options.branch}.`;
}