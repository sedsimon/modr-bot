/*
 * returns an array of block elements representing a decision log entry
 * that can be individually written to response using message.blocks.push().
 *
 * takes an `adrFile` object that resembles:
 * {
 *  name: <filename>,
 *  githubUrl: <link to the file in github>,
 *  data: <json object with the important data in the adr file>
 *    {
 *      title:
 *      "Accepted Solution": markdown block describing the solution
 *      "Problem Description": markdown block describing the problem
 *      frontmatter: <json object with frontmatter data>
 *    }
 * }
 */
export function toBlockFormat(adrFile) {

  let block = [
    {
      type: "divider"
    },
  ];

  const adrJsonObj = adrFile.data;

  // push the adr title
  if(adrJsonObj.title) {
    block.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Problem:* <${adrFile.githubUrl}|${adrJsonObj.title}>`,
      },
			accessory: {
				type: "button",
				text: {
					type: "plain_text",
					text: "List PRs",
				},
				value: adrFile.name,
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
      "committed-on": "Committed On",
      "decide-by": "Decide By",
      "review-by": "Review By",
      impact: "Impact",
    };
    
    const elements = [];
    for (const property in labels) {
      
      // add a context element if there is a matching property in the frontmatter
      if (adrJsonObj.frontmatter[property]) {
        elements.push(
          {
            type: "mrkdwn",
            text: `\`${labels[property]}: ${adrJsonObj.frontmatter[property]}\``,            
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
