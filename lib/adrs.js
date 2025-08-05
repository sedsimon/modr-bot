import { Octokit } from "octokit";
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import setAdrTitle from './setAdrTitle.js'
import setFrontmatter from './setFrontmatter.js'

// establish github connection
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const adr_re = new RegExp(process.env.GITHUB_ADR_REGEX);
const fullPathAdr_re = new RegExp(process.env.GITHUB_PATH_TO_ADRS + "/" + process.env.GITHUB_ADR_REGEX);

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
  } = await octokit.graphql(`
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
    `,
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
    if (isNaN(decide_by) || options.decideBefore <= decide_by) {
      return false;
    }
  }
  // if tags are specified, look for a match among the list of tags
  if (options.tags) {
     // Handle case where frontmatter.tags is null, undefined, or not an array
     if (!Array.isArray(frontmatter.tags)) {
       return false;
     }
     for (const tag of options.tags) {
       if (frontmatter.tags.includes(tag)) {
         return true;
       }
     }
     return false;
  }

  return true;

}


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
    } = await octokit.graphql(`
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
      `,
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
 * getMainSHA() - return the SHA for the main branch
 * used as a ref during new branch creation
 */

async function getMainSHA() {
  const {
    repository: {
      refs: {
        edges: [
          {
            node: {
              target: {
                oid: sha
              }
            }
          }
        ]
      }
    }
  } = await octokit.graphql(`
    query ($repo: String!, $owner: String!, $defaultBranch: String!) {
      repository(name: $repo, owner: $owner) {
        refs(refPrefix: "refs/heads/", query: $defaultBranch, last: 10) {
          edges {
            node {
              name
              prefix
              target {
                ... on Commit {
                  oid
                }
              }
            }
          }
        }
      }
    }`,
    {
      repo: process.env.GITHUB_REPO,
      owner: process.env.GITHUB_USER,
      defaultBranch: process.env.GITHUB_DEFAULT_BRANCH
    });

  return sha;

}

/*
 * createNewBranch(branchName,sha)
 * creates a new branch off the given ref (which should be the tip of the "main" branch)
 */
async function createNewBranch(branchName,sha) {
  const postResult = await octokit.request("POST /repos/{owner}/{repo}/git/refs",
  {
    ref: `refs/heads/${branchName}`,
    sha: sha,
    owner: process.env.GITHUB_USER,
    repo: process.env.GITHUB_REPO
  });

  return postResult;
}

/*
 * getNewFileContents(title,impact)
 * gets the contents of the new-adr-template file
 */

async function getTemplateContents() {
  const {
    repository : {
      object : {
        text: templateContents
      }
    }
  } = await octokit.graphql(`
    query ($repo: String!, $owner: String!, $template: String!)
    {
      repository(name: $repo, owner: $owner) {
        object(expression: $template) {
          ... on Blob {
            text          
          }
        }
      }
    }
    `,
    {
      owner: process.env.GITHUB_USER,
      repo: process.env.GITHUB_REPO,
      template: `${process.env.GITHUB_DEFAULT_BRANCH}:${process.env.GITHUB_PATH_TO_ADRS}/${process.env.GITHUB_ADR_TEMPLATE}`
    });

  return templateContents;

}

/*
 * getNewAdrContents(title,templateContents)
 * parses the templateContents variable as a markdown file and inserts the title.
 * Updates the frontmatter to include given impact, and sets status="open"
 * Returns the contents of the new ADR file as a string
 */
function getNewAdrContents(title,impact,templateContents) {

  return unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(setAdrTitle,{title: title})
  .use(setFrontmatter,{
    impact: impact,
    status: "open"
  })
  .use(remarkStringify)
  .processSync(templateContents)
  .toString();
        
}

/*
 * commitNewADR(branch,headline,expectedOid,path,text)
 * branch: name of the branch to commit to
 * headline: commit message
 * expectedOid: the current commit on the branch
 * path: the name of the file to commit
 * text: the contents of the file
 * 
 * returns the SHA of the new commit
 */
async function commitNewADR(branch,headline,expectedOid,path,text) {
  
  const {
    createCommitOnBranch : {
      commit : {
        oid : newSHA
      }
    }
  } = await octokit.graphql(`
    mutation (
      $branchName: String!, 
      $repoWithOwner: String!, 
      $headline:String!, 
      $expectedOid:GitObjectID!, 
      $pathToFile: String!, 
      $contents:Base64String!
    ){
      createCommitOnBranch (
        input: {
          branch: {
            branchName: $branchName, 
            repositoryNameWithOwner: $repoWithOwner
          }, 
          message: {
            headline: $headline
          }, 
          expectedHeadOid: $expectedOid, 
          fileChanges: {
            additions: {
              path: $pathToFile, contents: $contents
            }
          }
        }
      ) {
        commit {
          oid
        }
        ref {
          name
        }
      }
    }
  `,
    {
      branchName: branch,
      repoWithOwner: process.env.GITHUB_USER + "/" + process.env.GITHUB_REPO,
      headline: headline,
      expectedOid: expectedOid,
      pathToFile: path,
      contents: Buffer.from(text).toString('base64')
    }
  );
  return newSHA;
}

/*
 * getNewADRFilename(title) 
 * finds the next file counter by scanning all files in the directory (ouch)
 * uses the branch argument to create a short name for the file
 */

async function getNewADRFilename(branch) {

  // retrieve a list of files in the ADR directory
  const {
    repository: {
      object: {
        entries: adrFiles
      }
    }
  } = await octokit.graphql(`
  query ($repo:String!,$owner:String!,$adr_ref:String!) {
    repository(name: $repo, owner: $owner) {
      object(expression: $adr_ref) {
        ... on Tree {
          entries {
            name
          }
        }
      }
    }
  }
  `,
    {
      repo: process.env.GITHUB_REPO,
      owner: process.env.GITHUB_USER,
      adr_ref: `${process.env.GITHUB_DEFAULT_BRANCH}:${process.env.GITHUB_PATH_TO_ADRS}`
    });

  let adr_id = -1;

  // loop through files. If it is an ADR, record the file counter
  // ie: XXXX-title-of-adr.md
  for (const file of adrFiles) {
    if (adr_re.test(file.name)) {
      const fileId = parseInt(file.name.split("-")[0]);
      adr_id = fileId > adr_id ? fileId : adr_id;
    }
  }
  
  // increment the file counter and create a new filename for the ADR
  // by combining the file counter with the branch name
  adr_id++;
  let str_id = ("0000" + adr_id.toString());
  str_id = str_id.substring(str_id.length-4);

  return str_id + "-" + branch + ".md";
}

/*
 * createPullRequest(title,branch)
 * creates a new pull request and returns the URL
 */

async function createPullRequest(title,branch) {

  // first we need the repository ID
  const {
    repository: {
      id
    }
  } = await octokit.graphql(`
    query ($repo: String!, $owner: String!) {
      repository(name: $repo, owner: $owner) {
        id
      }
    }
  `,
  {
    repo: process.env.GITHUB_REPO,
    owner: process.env.GITHUB_USER
  });

  // now create the pull request using repo ID and arguments
  const {
    createPullRequest: {
      pullRequest: {
        url
      }
    }
  } = await octokit.graphql(`
    mutation ($repo_id: ID!, $baseRef:String!, $headRef:String!, $title:String!) {
      createPullRequest(input: {baseRefName: $baseRef, headRefName: $headRef, title: $title, repositoryId: $repo_id}) {
        pullRequest {
          url
        }
      }
    }
  `,
  {
    repo_id: id,
    baseRef: process.env.GITHUB_DEFAULT_BRANCH,
    headRef: branch,
    title: title
  });

  return url;
}


/*
 * createAdrFile(options)
 * 
 * given ADR title, impact and a branch name, create a new ADR file based on the template
 * in the repo. Insert the title and impact into the ADR.
 * Commit the new file to a new branch using the given branch name.
 * Create a pull request on the new branch.
 * Returns the URL of the pull request and the name of the new file.
 */

export async function createAdrFile(options) {

  const {
    title,
    branch,
    impact
  } = options;

  // find the commit on the tip of the main branch
  const mainSHA = await getMainSHA();

  // create a new branch off main
  await createNewBranch(branch,mainSHA);
  
  // read the template file
  const templateContents = await getTemplateContents();

  // create a new ADR by inserting the given arguments into the template
  const newAdrContents = getNewAdrContents(title,impact,templateContents);

  // calculate a name for the new ADR by incrementing the file counter
  const path = process.env.GITHUB_PATH_TO_ADRS + "/" + await getNewADRFilename(branch);

  // commit the new ADR to the branch
  await commitNewADR(branch,title,mainSHA,path,newAdrContents);

  // create a pull request for the new branch
  const url = await createPullRequest(title,branch);
  
  return {
    pullRequestUrl: url,
    adrFile: path
  };
  
}