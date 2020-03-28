function ResultSearch() {

  this.setSearchStrings = (searchStrings) => {
    this.searchStrings = searchStrings;
  };

  this.searchRootNode = (rootNode) => {
    const hits = this.searchText(rootNode.textContent);
    const filteredHits = this.filterOverlappingStrings(hits);
    return this.mapHitsToResultNodes(rootNode, filteredHits);
  };

  this.searchText = (text) => {
    const ac = new AhoCorasick(this.searchStrings);
    return ac.search(text).map(rawHit => {
      return {
        start: rawHit[0] - rawHit[1][0].length + 1,
        end: rawHit[0],
        text: rawHit[1][0]
      }
    });
  };

  this.filterOverlappingStrings = (hits) => {
    return hits.filter((hit, i) => {
      const nextHit = hits[i + 1];
      if (nextHit) {
        return (hit.end < nextHit.start);
      }
      return true;
    });
  };

  this.mapHitsToResultNodes = (rootNode, hits) => {
    const treeWalker = document.createTreeWalker(rootNode, 4);
    let currentTextIndex = 0;
    let nextHit = hits.shift();
    let currentNode = treeWalker.currentNode;
    const resultNodes = [];

    while (nextHit !== undefined && currentNode !== null) {
      // traverse node tree and locate text node containing next hit
      if (currentNode.nodeName !== '#text') {
        currentNode = treeWalker.nextNode();
        continue;
      }
      const nodeTextLength = currentNode.textContent.length;
      const nodeIncludesNextHit = currentTextIndex + nodeTextLength >= nextHit.end;

      if (nodeIncludesNextHit) {
        if (this.isValidHitAndNode(currentNode, nextHit, currentTextIndex)) {
          resultNodes.push(this.createResultNode(nextHit, currentNode, currentTextIndex));
        }
        nextHit = hits.shift();
      } else {
        currentTextIndex += nodeTextLength;
        currentNode = treeWalker.nextNode();
      }
    }

    return resultNodes;
  };

  this.isValidHitAndNode = (node, hit, currentTextIndex) => {
    return this.parentNodeIsValid(node)
      && !this.isEditable(node)
      && !this.isNestedString(hit, node.textContent, currentTextIndex)
      && !(hit.start < currentTextIndex);
  };

  this.parentNodeIsValid = (currentNode) => {
    if (currentNode.parentNode) {
      const parentNode = currentNode.parentNode;
      const parentNodeName = parentNode.nodeName;
      const isAlreadyWrapped = parentNode.classList.contains('click-and-roll-wrapper');
      return parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE' && !isAlreadyWrapped && !this.isEditable(parentNode);
    }
    return true;
  };

  this.isNestedString = (hit, nodeText, currentTextIndex) => {
    let nextChar = nodeText[hit.end - currentTextIndex + 1];
    return nextChar ? !!nextChar.match(/(?!(?:×|÷))[a-zA-Z\u00c0-\u017f]/) : false;
  };

  this.isEditable = (node) => {
    return node instanceof HTMLInputElement || node.isContentEditable;
  };

  this.createResultNode = (hit, hitNode, currentTextIndex) => {
    const range = document.createRange();
    range.setStart(hitNode, hit.start - currentTextIndex);
    range.setEnd(hitNode, hit.end - currentTextIndex + 1);

    const wrapper = document.createElement('span');
    wrapper.classList.add('click-and-roll-wrapper');
    range.surroundContents(wrapper);
    return wrapper;
  };

}
