function ResultSearch() {

  this.setSearchStrings = (searchStrings) => {
    this.searchStrings = searchStrings;
  };

  this.searchRootNode = (rootNode) => {
    const hits = this.searchText(rootNode.textContent);
    const filteredHits = this.filterSubStrings(hits);
    return this.mapHitsToResultNodes(rootNode, filteredHits);
  };

  this.searchText = (text) => {
    const ac = new AhoCorasick(this.searchStrings);
    return ac.search(text);
  };

  this.filterSubStrings = (hits) => {
    return hits.filter((hit, i) => {
      const nextHit = hits[i + 1];
      if (nextHit) {
        const hitEnd = this.getHitBounds(hit).end;
        const nextHitStart = this.getHitBounds(nextHit).start;

        return (hitEnd < nextHitStart);
      }
      return true;
    });
  };

  this.getHitBounds = (hit) => {
    const end = hit[0];
    const start = end - hit[1][0].length + 1;
    return {
      start,
      end
    }
  };

  this.mapHitsToResultNodes = (rootNode, hits) => {
    const treeWalker = document.createTreeWalker(rootNode, 4);
    let currentTextIndex = 0;
    let nextHit = this.getNextHit(hits);
    let currentNode = rootNode;
    const resultNodes = [];

    while (nextHit !== null && currentNode !== null) {
      // traverse node tree and locate text node containing next hit
      if (treeWalker.currentNode.nodeName !== '#text') {
        currentNode = treeWalker.nextNode();
        continue;
      }
      const nodeTextLength = currentNode.textContent.length;
      const nodeIncludesNextHit = currentTextIndex + nodeTextLength >= nextHit.index;

      if (nodeIncludesNextHit) {
        if (this.parentNodeIsValid(currentNode)) {
          const resultNode = this.createResultNode(nextHit, currentNode, currentTextIndex);
          if (resultNode !== null) resultNodes.push(resultNode);
        }
        nextHit = this.getNextHit(hits);
      } else {
        currentTextIndex += nodeTextLength;
        currentNode = treeWalker.nextNode();
      }
    }

    return resultNodes;
  };

  this.getNextHit = (hits) => {
    const rawHit = hits.shift();
    if (rawHit !== undefined) {
      return {
        index: rawHit[0],
        name: rawHit[1][0]
      }
    }
    return null;
  };

  this.parentNodeIsValid = (currentNode) => {
    if (currentNode.parentNode) {
      const parentNodeName = currentNode.parentNode.nodeName;
      return parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE';
    }
    return true;
  };

  this.createResultNode = (hit, hitNode, currentTextIndex) => {
    const hitEndOffset = hit.index - currentTextIndex + 1;
    const hitStartOffset = hitEndOffset - hit.name.length;

    if (hitStartOffset < 0) {
      /*
      Hit is not contained wholly by a single node:

      -  <div>LeBron</div><div>James</div>
      -  <div>LeBron <b>James</b></div>

      Or similar
       */
      return null;
    }

    const range = document.createRange();
    range.setStart(hitNode, hitStartOffset);
    range.setEnd(hitNode, hitEndOffset);

    const wrapper = document.createElement('span');
    range.surroundContents(wrapper);
    return wrapper;
  };

}
