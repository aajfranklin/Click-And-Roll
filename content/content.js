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
      'color: teal; display: inline;'
    );
    range.surroundContents(wrapper);

    wrapper.onmouseenter = handleHover;
  };

  const handleHover = (mouseEnterEvent) => {
    const element = mouseEnterEvent.target;
    const name = element.textContent;
    const newPlayerId = players.filter(player => player.name === name)[0].id;

    showOverlay(element);
    if (newPlayerId !== currentPlayerId) {
      currentPlayerId = newPlayerId;
      fetchAndDisplayStats(currentPlayerId, name);
    }
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

  const fetchAndDisplayStats = (id, name) => {
    $.ajax(chrome.extension.getURL('view/templates.html'), {method: 'GET'})
      .then(templates => {
        statOverlay.innerHTML = templates;
        document.getElementById('click-and-roll-dismiss').onclick = () => closeOverlay;
        document.addEventListener('click', closeOverlay);
        return backgroundScriptFetch({message: 'fetchStats', id});
      })
      .then(stats => {
        document.getElementById('click-and-roll-player-name').textContent = name;
        mapPlayerProfile(stats.profile, name);
        mapCareerStatsToRows(stats.career);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const closeOverlay = (e) => {
    if (e.target.id === 'click-and-roll-dismiss' || (e.target !== statOverlay && !statOverlay.contains(e.target))) {
      document.body.removeChild(statOverlay);
      document.removeEventListener('click', closeOverlay);
    }
  };

  const mapPlayerProfile = (profile, name) => {
    if (profile.image) {
      const profileImageElement = document.getElementById('click-and-roll-player-profile-image');
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
      const infoDataElement = document.getElementById('click-and-roll-info-' + profileInfoDetails[i]);
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

      const row = document.createElement('tr');

      for (let k = 0; k < season.length; k++) {
        const stat = document.createElement('td');
        if (k === 0) {
          stat.classList.add('season');
        }
        stat.textContent = season[k] || 'n/a';
        row.appendChild(stat)
      }

      document.getElementById('click-and-roll-season-averages-body').appendChild(row);
    }
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

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.type = 'text/css';
  style.href = chrome.extension.getURL('view/styling.css');
  (document.head || document.documentElement).appendChild(style);

  const statOverlay = document.createElement('div');
  statOverlay.id = 'click-and-roll-stat-overlay';

  let currentPlayerId;
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
