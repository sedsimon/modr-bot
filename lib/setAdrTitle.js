import {visit} from 'unist-util-visit';

export default options => tree => {
  visit(
    tree,
    // only visit the title section. This has node type = heading and depth 1
    node =>
    node && node.type === 'heading' && node.depth === 1,
    node => {
      node.children[0].value = options.title;
    }
  );
};