let statOverlay;

const run = () => {
  const playerNames = playersById.map((player) => player.name);
  const body = document.body;
  const initialResults = searchTextContent(body, playerNames);
  statOverlay = document.createElement('span');
  statOverlay.setAttribute('class', 'click-and-roll-stat-overlay');

  if (initialResults.length > 0) {
    locateAndFormatResults(body, initialResults);
  }

  observeMutations(playerNames);
};

const searchTextContent = (rootNode, playerNames) => {
  const nodeText = rootNode.textContent;
  const ac = new AhoCorasick(playerNames);
  return ac.search(nodeText);
};

const locateAndFormatResults = (rootNode, results) => {
  const treeWalker = document.createTreeWalker(rootNode, 4);
  let currentTextIndex = 0;
  let nextResult = getNextResult(results);

  while (nextResult !== undefined) {
    // traverse node tree and locate text node containing next result
    const currentNode = treeWalker.currentNode.nodeName === '#text'
                          ? treeWalker.currentNode
                          : treeWalker.nextNode();
    const nodeTextLength = currentNode.textContent.length;
    const nodeIncludesNextResult = currentTextIndex + nodeTextLength >= nextResult.index;

    if (nodeIncludesNextResult) {
      // do not reformat text nodes within script and style elements, these are not displayed to the user
      const parentNodeName = currentNode.parentNode.nodeName;
      const parentNodeIsValid = parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE';

      if (parentNodeIsValid) {
        highlightResult(nextResult, currentNode, currentTextIndex);
      }

      nextResult = getNextResult(results);

    } else {
      currentTextIndex += nodeTextLength;
      treeWalker.nextNode();
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

  return undefined;
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
    'background-color: yellow; display: inline;'
  );
  range.surroundContents(wrapper);

  wrapper.onmouseenter = function() {
    const absoluteOffset = getAbsoluteOffset(wrapper);
    statOverlay.style.top = absoluteOffset.top + 'px';
    statOverlay.style.left = absoluteOffset.left + 'px';
    document.body.appendChild(statOverlay);
  };
};

const getAbsoluteOffset = function(element) {
  const rect = element.getBoundingClientRect();
  const scrollX = -(window.scrollX ? window.scrollX : window.pageXOffset);
  const scrollY = -(window.scrollY ? window.scrollY : window.pageYOffset);

  const overlayLeft = rect.left < window.innerWidth / 2
    ? rect.left - scrollX
    : rect.left - scrollX - window.innerWidth / 2 + rect.width;

  const overlayTop = rect.top < window.innerHeight / 2
    ? rect.top - scrollY + rect.height
    : rect.top - scrollY - window.innerHeight / 2;

  return {
    left: overlayLeft,
    top: overlayTop
  }
};

const observeMutations = (playerNames) => {
  const observer = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const addedNodes = mutations[i].addedNodes;
      if (addedNodes.length > 0) {
        const mutationRootNode = addedNodes[0];
        const results = searchTextContent(mutationRootNode, playerNames);
        if (results.length > 0) {
          observer.disconnect();
          locateAndFormatResults(mutationRootNode, results);
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

run();
