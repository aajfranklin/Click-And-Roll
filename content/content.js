const backgroundScriptFetch = (request) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response => {
      const [err, res] = response;
      if (err != null) {
        reject(err);
      } else {
        resolve(res);
      }
    }));
  });
};

const saveToChromeStorage = (name, values) => {
  chrome.storage.local.set({[name]: values}, () => {
    console.log(name + ' saved');
  });
};

const run = (players) => {
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

    wrapper.onmouseenter = showStats;
  };

  const showStats = (mouseEnterEvent) => {
    const element = mouseEnterEvent.target;
    const name = element.textContent;
    const id = players.filter(player => player.name === name)[0].id;

    showOverlay(element);
    backgroundScriptFetch({message: 'fetchStats', id})
      .then(stats => {
        statOverlay.textContent = JSON.stringify(stats);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const showOverlay = (element) => {
    const rect = element.getBoundingClientRect();
    const elementIsInLeftHalf = rect.left < window.innerWidth / 2;
    const elementIsInTopHalf = rect.top < window.innerHeight / 2;

    // remove existing animation class
    statOverlay.classList.remove(statOverlay.classList[0]);

    if (elementIsInTopHalf) {
      statOverlay.classList.add('reveal-from-top');
    } else {
      statOverlay.classList.add('reveal-from-bottom');
    }

    const absoluteOffset = getAbsoluteOffset(rect, elementIsInLeftHalf, elementIsInTopHalf);
    statOverlay.style.top = absoluteOffset.top + 'px';
    statOverlay.style.left = absoluteOffset.left + 'px';
    document.body.appendChild(statOverlay);
  };

  const getAbsoluteOffset = (rect, elementIsInLeftHalf, elementIsInTopHalf) => {
    const scrollX = -(window.scrollX ? window.scrollX : window.pageXOffset);
    const scrollY = -(window.scrollY ? window.scrollY : window.pageYOffset);

    const overlayLeft = elementIsInLeftHalf
      ? rect.left - scrollX
      : rect.left - scrollX - window.innerWidth / 2 + rect.width;

    const overlayTop = elementIsInTopHalf
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

  const statOverlay = document.createElement('span');
  statOverlay.id = 'click-and-roll-stat-overlay';
  const playerNames = players.map((player) => player.name);
  const body = document.body;
  const initialResults = searchTextContent(body, playerNames);

  if (initialResults.length > 0) {
    locateAndFormatResults(body, initialResults);
  }

  observeMutations(playerNames);
};

chrome.storage.local.get(['players'], (response) => {
  const players = response.players;

  if (players === undefined) {
    backgroundScriptFetch({message: 'fetchPlayers'})
      .then(players => {
        saveToChromeStorage('players', players);
        run(players);
      })
      .catch(err => {
        console.log(err);
      })
  } else {
    run(players);
  }
});
