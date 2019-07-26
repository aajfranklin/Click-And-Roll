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
        let parentNodeIsValid = true;

        if (currentNode.parentNode) {
          const parentNodeName = currentNode.parentNode.nodeName;
          parentNodeIsValid = parentNodeName !== 'SCRIPT' && parentNodeName !== 'STYLE';
        }

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
      'color: teal; display: inline;'
    );
    range.surroundContents(wrapper);

    wrapper.onmouseenter = handleHover;
  };

  const handleHover = (mouseEnterEvent) => {
    const targetElement = mouseEnterEvent.target;
    const name = targetElement.textContent;
    const newPlayerId = players.filter(player => player.name === name)[0].id;

    const oldContainerParent = frameContainer.parentNode;
    const newContainerParent = getContainerParentFromElement(targetElement);

    if (newContainerParent !== oldContainerParent) {
      if (oldContainerParent) {
        frameContainer.parentNode.removeChild(frameContainer);
      }

      newContainerParent.appendChild(frameContainer);
      frameContainer.appendChild(clickAndRollFrame);

      clickAndRollFrame.contentDocument.body.id = 'click-and-roll-frame-body';

      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.type = 'text/css';
      style.href = chrome.extension.getURL('view/frame.css');
      clickAndRollFrame.contentDocument.head.appendChild(style);
    }

    clickAndRollFrame.contentDocument.body.innerHTML = '';
    positionFrameContainer(targetElement, newContainerParent);

    if (newPlayerId !== currentPlayerId) {
      currentPlayerId = newPlayerId;
      backgroundScriptFetch({message: 'fetchStats', playerId: currentPlayerId})
        .then(stats => displayStats(stats, name));
    } else {
      displayStats();
    }
  };

  const getContainerParentFromElement = (element) => {
    let rootOffsetParent = element;
    let rootScrollParent = null;

    while (rootOffsetParent.offsetParent) {
      rootOffsetParent = rootOffsetParent.offsetParent;
      rootScrollParent = (rootOffsetParent.scrollHeight > rootOffsetParent.clientHeight)
        ? rootOffsetParent
        : rootScrollParent;
    }

    return (rootOffsetParent === document.body)
      ? document.body
      : rootScrollParent || rootOffsetParent;
  };

  const positionFrameContainer = (targetElement, containerParent) => {
    const rect = targetElement.getBoundingClientRect();
    const elementIsInLeftHalf = rect.left < window.innerWidth / 2;
    const elementIsInTopHalf = rect.top < window.innerHeight / 2;

    frameContainer.style.marginLeft = elementIsInLeftHalf ? '0' : '4px';

    // remove existing animation class
    statDisplay.classList.remove(statDisplay.classList[0]);

    if (elementIsInTopHalf) {
      statDisplay.classList.add('reveal-from-top');
    } else {
      statDisplay.classList.add('reveal-from-bottom');
    }

    const offset = getOffsetFromParent(rect, elementIsInLeftHalf, elementIsInTopHalf, containerParent);
    frameContainer.style.top = offset.top + 'px';
    frameContainer.style.left = offset.left + 'px';
  };

  const getOffsetFromParent = (rect, elementIsInLeftHalf, elementIsInTopHalf, containerParent) => {
    const scrollX = (containerParent === document.body)
      ? (window.scrollX ? window.scrollX : window.pageXOffset)
      : containerParent.scrollLeft;
    const scrollY = (containerParent === document.body)
      ? (window.scrollY ? window.scrollY : window.pageYOffset)
      : containerParent.scrollTop;

    const parentOffset = {
      x: (containerParent === document.body) ? 0 : containerParent.getBoundingClientRect().left,
      y: (containerParent === document.body) ? 0 : containerParent.getBoundingClientRect().top
    };

    // 2 pixel left offset to accommodate box shadow of frame's inner elements
    const overlayLeft = elementIsInLeftHalf
      ? rect.left + scrollX - parentOffset.x - 2
      : rect.left + scrollX - parentOffset.x - 2 - window.innerWidth / 2 + rect.width;

    const overlayTop = elementIsInTopHalf
      ? rect.top + scrollY - parentOffset.y + rect.height
      : rect.top + scrollY - parentOffset.y - window.innerHeight / 2;

    return {
      left: overlayLeft,
      top: overlayTop
    }
  };

  const displayStats = (stats, name) => {
    if (stats) {
      statDisplay.innerHTML = statDisplayTemplate;
      clickAndRollFrame.contentDocument.body.appendChild(statDisplay);
      clickAndRollFrame.contentDocument.getElementById('click-and-roll-player-name').textContent = name;
      mapPlayerProfile(stats.profile, name);
      mapCareerStatsToRows(stats.career);
    } else {
      clickAndRollFrame.contentDocument.body.appendChild(statDisplay);
    }

    clickAndRollFrame.contentDocument.getElementById('click-and-roll-dismiss').onclick = closeOverlay;
    document.addEventListener('click', closeOverlay);
  };

  const mapPlayerProfile = (profile, name) => {
    if (profile.image) {
      const profileImageElement = clickAndRollFrame.contentDocument.getElementById('click-and-roll-player-profile-image');
      profileImageElement.src = profile.image;
      profileImageElement.alt = name;
    }

    const profileInfoDetails = [
      'team',
      'number',
      'position',
      'birthday',
      'height',
      'weight',
      'country',
      'college',
      'draft'
    ];

    for (let i = 0; i < profileInfoDetails.length; i++) {
      const infoDataElement = clickAndRollFrame.contentDocument.getElementById('click-and-roll-info-' + profileInfoDetails[i]);
      infoDataElement.textContent = profile[profileInfoDetails[i]];
    }
  };

  const mapCareerStatsToRows = (careerStats) => {
    for (let i = 0; i < careerStats.seasons.rowSet.length; i++) {
      const season = careerStats.seasons.rowSet[i];
      const statsToRemove = [3, 2, 0];

      for (let j = 0; j < statsToRemove.length; j++) {
        season.splice(statsToRemove[j], 1);
      }

      const row = clickAndRollFrame.contentDocument.createElement('tr');

      for (let k = 0; k < season.length; k++) {
        const stat = clickAndRollFrame.contentDocument.createElement('td');
        if (k === 0) {
          stat.classList.add('click-and-roll-season');
        }
        stat.textContent = (season[k] === null)
          ? 'n/a'
          : season[k];
        row.appendChild(stat)
      }

      clickAndRollFrame.contentDocument.getElementById('click-and-roll-season-averages-body').appendChild(row);
    }
  };

  const closeOverlay = () => {
    frameContainer.parentNode.removeChild(frameContainer);
    document.removeEventListener('click', closeOverlay);
  };

  const observeMutations = (playerNames) => {
    const observer = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const addedNodes = mutations[i].addedNodes;
        if (addedNodes.length > 0) {
          const mutationRootNode = addedNodes[0];
          const mutationTargetId = mutations[i].target.id;
          if ((mutationTargetId + mutationRootNode.id).indexOf('click-and-roll') !== -1){
            continue;
          }
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

  const frameContainer = document.createElement('div');
  const clickAndRollFrame = document.createElement('iframe');
  const statDisplay = document.createElement('div');
  frameContainer.id = 'click-and-roll-frame-container';
  clickAndRollFrame.id ='click-and-roll-frame';
  statDisplay.id = 'click-and-roll-stat-display';

  let currentPlayerId;
  let statDisplayTemplate;

  $.ajax(chrome.extension.getURL('view/frame.html'), {method: 'GET'})
    .then(frameHtml => {
      statDisplayTemplate = frameHtml;
    });

  const playerNames = players.map((player) => player.name);
  const initialResults = searchTextContent(document.body, playerNames);

  if (initialResults.length > 0) {
    locateAndFormatResults(document.body, initialResults);
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
