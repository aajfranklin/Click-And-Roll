const searchTextContent = (rootNode, playerNames) => {
  const nodeText = rootNode.textContent;
  const ac = new AhoCorasick(playerNames);
  return ac.search(nodeText);
};

const locateAndFormatResults = (rootNode, results) => {
  const treeWalker = document.createTreeWalker(rootNode, 4);
  let currentTextIndex = 0;
  let nextResult = getNextResult(results);
  let currentNode = rootNode;

  while (nextResult !== null && currentNode !== null) {
    // traverse node tree and locate text node containing next result
    currentNode = treeWalker.currentNode.nodeName === '#text'
      ? treeWalker.currentNode
      : treeWalker.nextNode();
    const nodeTextLength = currentNode.textContent.length;
    const nodeIncludesNextResult = currentTextIndex + nodeTextLength >= nextResult.index;

    if (nodeIncludesNextResult) {
      if (parentNodeIsValid(currentNode)) {
        highlightResult(nextResult, currentNode, currentTextIndex);
      }
      nextResult = getNextResult(results);
    } else {
      currentTextIndex += nodeTextLength;
      currentNode = treeWalker.nextNode();
    }
  }
};

const getNextResult = (results) => {
  const rawResult = results.shift();
  if (rawResult !== undefined) {
    return {
      index: rawResult[0],
      name: rawResult[1][0]
    }
  }
  return null;
};

const parentNodeIsValid = (currentNode) => {
  if (currentNode.parentNode) {
    const parentNodeName = currentNode.parentNode.nodeName;
    return parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE';
  }
  return true;
};

const highlightResult = (result, node, currentTextIndex) => {
  const resultEndOffset = result.index - currentTextIndex + 1;
  const resultStartOffset = resultEndOffset - result.name.length;

  if (resultStartOffset < 0) {
    // match is probably split into two nodes with text formatting on surname i.e. LeBron <b>James</b>
    return;
  }

  const range = document.createRange();
  range.setStart(node, resultStartOffset);
  range.setEnd(node, resultEndOffset);

  const wrapper = document.createElement('span');
  wrapper.setAttribute(
    'style',
    'color: teal; display: inline;'
  );
  range.surroundContents(wrapper);

  wrapper.onmouseenter = handleHover;
};

const observeMutations = (playerNames) => {
  const observer = new MutationObserver(function (mutations) {

    if (document.body.textContent !== lastBodyText) {
      lastBodyText = document.body.textContent;

      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes) {
          mutations[i].addedNodes.forEach(node => {
            if (node.innerText && node.innerText.trim().length >= 4) {
              const results = searchTextContent(node, playerNames);
              if (results.length > 0) {
                observer.disconnect();
                locateAndFormatResults(node, results);
                observer.observe(document.body, { childList: true, subtree: true });
              }
            }
          });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
