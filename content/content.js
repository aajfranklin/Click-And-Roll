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

  const handleHover = (mouseEnterEvent) => {
    const targetElement = mouseEnterEvent.target;
    const name = targetElement.textContent;
    const newPlayerId = players.filter(player => player.name === name)[0].id;

    const oldContainerParent = frameContainer.parentNode;
    const newContainerParent = getContainerParentFromElement(targetElement);

    if (newContainerParent !== oldContainerParent) {
      updateContainerParent(oldContainerParent, newContainerParent);
    }

    clickAndRollFrame.contentDocument.body.innerHTML = '';
    positionFrameContainer(targetElement, newContainerParent);
    statDisplay.classList.remove('loaded');
    statDisplay.classList.add('loading');
    clickAndRollFrame.contentDocument.body.appendChild(statDisplay);

    if (newPlayerId !== currentPlayerId) {
      statDisplay.innerHTML = statTemplate;
      currentPlayerId = newPlayerId;
      dataReceived = false;
      backgroundScriptFetch({message: 'fetchStats', playerId: currentPlayerId})
        .then(stats => {
          // current player id may have been reassigned by a later hover, making these stats out of date
          if (newPlayerId === currentPlayerId) {
            dataReceived = true;
            displayStats(stats, name)
          }
        });
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

  const updateContainerParent = (oldParent, newParent) => {
    if (oldParent) {
      frameContainer.parentNode.removeChild(frameContainer);
    }

    newParent.appendChild(frameContainer);
    frameContainer.appendChild(clickAndRollFrame);

    clickAndRollFrame.contentDocument.body.id = 'frame-body';

    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = frameStyle;
    clickAndRollFrame.contentDocument.head.appendChild(style);
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
    frameContainer.hidden = false;
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
    /*
    * Catches the edge case where user has hovered on the same name twice in quick succession,
    * ensures the loading graphic continues to display until data has come in
     */
    if (!dataReceived) return;

    statDisplay.classList.remove('loading');
    statDisplay.classList.add('loaded');

    if (stats) {
      clickAndRollFrame.contentDocument.getElementsByClassName('player-name')[0].textContent = name;
      mapPlayerProfile(stats.profile, name);
      mapCareerStatsToRows(stats.career);
    }

    clickAndRollFrame.contentDocument.getElementsByClassName('dismiss')[0].onclick = closeOverlay;
    document.addEventListener('click', closeOverlay);
  };

  const mapPlayerProfile = (profile, name) => {
    const profileImageElement = clickAndRollFrame.contentDocument.getElementById('player-profile-image');

    fetch(profile.imageUrl, {cache: 'force-cache', redirect: 'error'})
      .then(() => {
        profileImageElement.src = profile.imageUrl;
        profileImageElement.alt = name;
      })
      .catch(err => {
        console.log(err);
      });

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
      const infoDataElement = clickAndRollFrame.contentDocument.getElementById('info-' + profileInfoDetails[i]);
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
          stat.classList.add('season');
        }
        stat.textContent = (season[k] === null)
          ? 'n/a'
          : season[k];
        row.appendChild(stat)
      }

      clickAndRollFrame.contentDocument.getElementById('season-averages-body').appendChild(row);
    }
  };

  const closeOverlay = () => {
    frameContainer.hidden = true;
    document.removeEventListener('click', closeOverlay);
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

  const frameContainer = document.createElement('div');
  const clickAndRollFrame = document.createElement('iframe');
  const statDisplay = document.createElement('div');
  frameContainer.id = 'click-and-roll-frame-container';
  clickAndRollFrame.id ='click-and-roll-frame';
  statDisplay.id = 'stat-display';

  let currentPlayerId;
  let dataReceived;
  let statTemplate;
  let frameStyle;

  $.ajax(chrome.extension.getURL('view/frame.html'), {method: 'GET'})
    .then(response => {
      statTemplate = response;
      return $.ajax(chrome.extension.getURL('view/frame.css'), {method: 'GET'})
    })
    .then(response => {
      frameStyle = response;
    });

  let lastBodyText = document.body.textContent;
  const playerNames = players.map((player) => player.name);
  const initialResults = searchTextContent(document.body, playerNames);

  if (initialResults.length > 0) {
    locateAndFormatResults(document.body, initialResults);
  }

  observeMutations(playerNames);
};

const checkPlayerCache = () => {
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
};

window.addEventListener('load', checkPlayerCache);
