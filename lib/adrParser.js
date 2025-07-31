import YAML from 'yaml'

/*
 * takes an AST and a section header, and finds the associated text under that header.
 * makes the following assumptions about format of the ADR file:
 * 
 * 1. must have yaml frontmatter
 * 2. the first section after the frontmatter is the title
 * 3. the rest of the ADR is indexed by level 2 headers
 * 
 * Takes the name of each level 2 header and creates a new JSON entry like:
 *    "header name": <next markdown object>
 * 
 * eg: the following markdown:
 * 
 ---
  impact: high
 ---
 # This is a big decision
 
 ## Problem Description
 This was a really hard problem to work on
 
 ## Accepted Solution
 We finally figured it out
 
 * Will be parsed as follows:
 {
   frontmatter :
    {
      impact: "high"
    },
   title : "This is a big decision",
   "Problem Description" : "This was a really hard problem to work on",
   "Accepted Solution" : "We finally figured it out"
 }
 */

export function adrToJSON(ast) {
  
  // 'children' is an array of markdown blocks, such as headers, paragraphs, lists etc
  const {children} = ast;

  let jsonObj = {};

  // Handle empty AST gracefully
  if (!children || children.length === 0) {
    return jsonObj;
  }

  let titleIndex = 0;

  // look for YAML frontmatter
  if (children[0].type == "yaml") {
    jsonObj.frontmatter = YAML.parse(children[0].value);
    titleIndex = 1; // Title is at position 1 when frontmatter exists
  }

  // Find and extract the title (first heading with depth 1)
  if (children.length > titleIndex && 
      children[titleIndex].type === "heading" && 
      children[titleIndex].depth === 1 &&
      children[titleIndex].children &&
      children[titleIndex].children[0]) {
    jsonObj.title = children[titleIndex].children[0].value;
  }

  // Extract level 2 headers and their content
  let i = 0;
  while (i < children.length) {
    if (children[i].type == "heading" && children[i].depth == 2) {
      // found a section header
      if (children[i].children && children[i].children[0] && 
          i + 1 < children.length && 
          children[i + 1].type === "paragraph" &&  // Only extract content from paragraphs
          children[i + 1].children && 
          children[i + 1].children[0]) {
        jsonObj[children[i].children[0].value] = children[i+1].children[0].value;
      }
    }
    i++;
  }
  
  return jsonObj;
}
