import {visit} from 'unist-util-visit';
import YAML from 'yaml'

export default options => tree => {
  visit(
    tree,
    // only visit the title section. This has node type = heading and depth 1
    node =>
    node && node.type === 'yaml',
    node => {
      const frontmatter = YAML.parse(node.value);
      frontmatter.impact = options.impact;
      frontmatter.status = options.status;
      node.value = YAML.stringify(frontmatter);
    }
  );
};