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
