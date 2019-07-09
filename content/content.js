const searchDocumentBody = () => {
  const players = ['Chris Bosh', 'Dwyane Wade', 'LeBron James', 'Kyrie Irving', 'Kevin Love'];
  const bodyText = document.body.textContent;
  const ac = new AhoCorasick(players);
  return ac.search(bodyText);
};

const getNextResult = (results) => {
  const rawResult = results.shift();

  if (rawResult !== undefined) {
    return {
      index: rawResult[0],
      name: rawResult[1][0]
    }
  }

  return undefined;
};

const locateAndFormatResults = (results) => {
  const treeWalker = document.createTreeWalker(document.body, 4);
  let currentTextIndex = 0;
  let nextResult = getNextResult(results);

  while (nextResult !== undefined) {
    // traverse node tree and locate node containing next result
    const currentNode = treeWalker.nextNode();
    const nodeTextLength = currentNode.textContent.length;
    const nodeIncludesNextMatch = currentTextIndex + nodeTextLength >= nextResult.index;

    if (nodeIncludesNextMatch) {
      // do not reformat text nodes within script and style elements, to preserve DOM integrity
      const parentNodeName = currentNode.parentNode.nodeName;
      const parentNodeIsValid = parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE';

      if (parentNodeIsValid) {
        highlightResult(nextResult, currentNode, currentTextIndex);
      }

      nextResult = getNextResult(results);
      treeWalker.previousNode();

    } else {
      currentTextIndex += nodeTextLength;
    }
  }
};

const highlightResult = (result, node, currentTextIndex) => {
  const resultEndOffset = result.index - currentTextIndex + 1;
  const resultStartOffset = resultEndOffset - result.name.length;

  const range = document.createRange();
  range.setStart(node, resultStartOffset);
  range.setEnd(node, resultEndOffset);

  const wrapper = document.createElement('span');
  wrapper.setAttribute(
    'style',
    'background-color: yellow; display: inline;'
  );
  range.surroundContents(wrapper);
};

const results = searchDocumentBody();
locateAndFormatResults(results);
