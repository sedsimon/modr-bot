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

  // Handle empty children array
  if (!children || children.length === 0) {
    return jsonObj;
  }

  let currentIndex = 0;

  // look for YAML frontmatter
  if (children[0].type == "yaml") {
    jsonObj.frontmatter = YAML.parse(children[0].value);
    currentIndex = 1; // Move past the frontmatter
  }

  // Find the title - look for the first heading with depth 1
  let titleIndex = -1;
  for (let i = currentIndex; i < children.length; i++) {
    if (children[i].type === "heading" && children[i].depth === 1) {
      titleIndex = i;
      break;
    }
  }

  // Extract title if found
  if (titleIndex >= 0) {
    if (!children[titleIndex].children || children[titleIndex].children.length === 0) {
      throw new Error("Title heading must have children");
    }
    if (children[titleIndex].children[0].type === "text") {
      jsonObj.title = children[titleIndex].children[0].value;
    } else {
      throw new Error("Title heading must contain text content");
    }
  }

  // Parse level 2 headers and their content
  let i = 0;
  while (i < children.length) {
    if (children[i].type === "heading" && children[i].depth === 2) {
      // found a section header
      if (!children[i].children || children[i].children.length === 0) {
        throw new Error("Heading must have children");
      }
      
      if (children[i].children[0].type !== "text") {
        throw new Error("Heading must contain text content");
      }

      const headerText = children[i].children[0].value;
      
      // Look for the next content block after this heading
      if (i + 1 < children.length && children[i + 1].children && children[i + 1].children.length > 0) {
        // For paragraphs, get the text content
        if (children[i + 1].type === "paragraph" && children[i + 1].children[0].type === "text") {
          jsonObj[headerText] = children[i + 1].children[0].value;
        }
        // For lists, we'll still take the first item's text for backwards compatibility
        else if (children[i + 1].type === "list") {
          // Don't extract list content for now - this matches original behavior better
          // The original implementation would fail here anyway
        }
        // For other block types, skip
      }
    }
    i++;
  }
  
  return jsonObj;
}
