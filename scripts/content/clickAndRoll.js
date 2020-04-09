function ClickAndRoll() {
  this.activeName = {
    element: null,
    isInTopHalf: null,
    isInLeftHalf: null,
  };
  this.bodyText = document.body.textContent;
  this.currentPlayerId = null;
  this.dataReceived = false;
  this.frame = document.createElement('iframe');
  this.frame.id ='click-and-roll-frame';
  this.frameContainer = document.createElement('div');
  this.frameContainer.id = 'click-and-roll-frame-container';
  this.frameContent = document.createElement('div');
  this.frameContent.id = 'frame-content';
  this.isRunning = false;
  this.observer = null;
  this.players = [];
  this.resultSearch = new ResultSearch();
  this.scrollParent = null;
  this.hoverTimer = null;
  this.reverse = false;

  this.utils = new Utils();

  this.handleMessage = (request) => {
    switch (request.message) {
      case 'start':
        if (!this.isRunning) this.run();
        break;
      case 'stop':
        if (this.isRunning) this.teardown();
        break;
      default:
        return;
    }
  };

  this.run = () => {
    this.isRunning = true;

    window.addEventListener('yt-navigate-start', this.onYtNavigate);

    return this.getPlayers()
      .then(players => {
        this.players = players.concat(nicknameMap);
        return $.ajax(browser.runtime.getURL('view/frame.html'), {method: 'GET', dataType: 'text'});
      })
      .then(response => {
        this.statTemplate = response;
        return $.ajax(browser.runtime.getURL('view/frame.css'), {method: 'GET', dataType: 'text'});
      })
      .then(response => {
        this.frameStyle = response;

        const playerNames = this.players.map((player) => player['NAME']);

        this.resultSearch.setSearchStrings(playerNames);
        const resultNodes = this.resultSearch.searchRootNode(document.body);

        this.highlight(resultNodes);
        this.handleReportedEdgeCases();
        this.observeMutations();
      });
  };

  this.onYtNavigate = () => {
    window.location.reload();
  };

  this.getPlayers = () => {
    let lastUpdated;

    return this.utils.getFromLocalStorage('players-timestamp')
      .then(timestamp => {
        lastUpdated = timestamp || 0;
        return this.utils.getFromLocalStorage('players');
      })
      .then(players => {
        const playersUpdatedWithin24Hours = Date.now() - lastUpdated < (config.playersUpdateInterval);
        if (players && playersUpdatedWithin24Hours) return Promise.resolve(players);
        return this.utils.sendRuntimeMessage({message: 'fetchPlayers'})
      })
      .then(fetchedPlayers => {
        this.utils.saveToLocalStorage('players', fetchedPlayers);
        return fetchedPlayers;
      });
  };

  this.highlight = (nodes) => {
    nodes.forEach(node => {
      node.style.color = 'teal';
      node.style.display = 'inline';
      node.onmouseenter = this.handleMouseEnter;
      node.onmouseleave = this.handleMouseLeave;
    });
  };

  this.observeMutations = () => {
    if (this.observer === null) {
      this.observer = new MutationObserver(() => {
        if (this.bodyText !== document.body.textContent) {
          this.bodyText = document.body.textContent;
          const resultNodes = this.resultSearch.searchRootNode(document.body);

          this.observer.disconnect();
          this.highlight(resultNodes);
          this.observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }

    this.observer.observe(document.body, { childList: true, subtree: true });
  };

  this.handleMouseEnter = (mouseEnterEvent) => {
    this.hoverTimer = setTimeout(() => this.handleHover(mouseEnterEvent), config.hoverTimeout);
  };

  this.handleMouseLeave = () => {
    clearTimeout(this.hoverTimer);
  };

  this.handleHover = (event) => {
    this.updateActiveName(event.target);

    const newPlayerId = this.players.filter(player => player['NAME'] === this.activeName.element.textContent)[0]['PLAYER_ID'];
    this.currentPlayerId = newPlayerId;
    this.dataReceived = false;

    this.resetFrame();

    if (this.isFirefox()) {
      this.frame.contentWindow.addEventListener('load', () => {
        this.getStats(newPlayerId);
      });
      return;
    }

    this.getStats(newPlayerId);
  };

  this.isFirefox = () => {
    return navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  };

  this.getStats = (newPlayerId) => {
    return this.utils.isSettingOn('reverse')
      .then(reverse => {
        this.reverse = reverse;
        return this.utils.sendRuntimeMessage({message: 'fetchStats', playerId: this.currentPlayerId});
      })
      .then(stats => {
        // current player id may have been reassigned by a later hover, making these stats out of date
        if (newPlayerId === this.currentPlayerId) {
          this.dataReceived = true;
          this.displayStats(stats, this.activeName.element.textContent)
        }
      })
      .catch(() => {
        this.displayNetworkError();
      });
  };

  this.updateActiveName = (target) => {
    // reapply handle hover to previous element
    if (this.activeName.element) {
      this.activeName.element.onmouseenter = this.handleMouseEnter;
      this.activeName.element.onmouseleave = this.handleMouseLeave;
    }
    this.activeName.element = target;
    this.activeName.element.onmouseenter = null;
    this.activeName.element.onmouseleave = null;
  };

  this.resetFrame = () => {
    this.attachFrame();

    if (this.isFirefox()) {
      this.frame.contentWindow.addEventListener('load', this.initialiseFrame);
      return;
    }

    this.initialiseFrame();
  };

  this.attachFrame = () => {
    if (this.frameContainer.parentNode) this.frameContainer.parentNode.removeChild(this.frameContainer);
    document.body.appendChild(this.frameContainer);
    this.frameContainer.appendChild(this.frame);
  };

  this.initialiseFrame = () => {
    this.applyScrollRule();
    this.applyFrameStyles();
    this.getFrameDocument().body.innerHTML = '';
    this.positionFrameContainer();
    this.applyAnimationClass();
    this.getFrameDocument().body.appendChild(this.frameContent);
    this.setFrameLoading();
    this.addCloseOverlayListeners();
    this.addTabListeners();
  };

  this.applyFrameStyles = () => {
    this.getFrameDocument().body.id = 'frame-body';
    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = this.frameStyle;
    style.title = 'click-and-roll';
    this.getFrameDocument().head.appendChild(style);
    this.frameContainer.style.height = 'calc(50vh + 2px)';
  };

  this.applyScrollRule = () => {
    this.setScrollParent();
    if (this.scrollParent !== document.body) {
      this.scrollParent.addEventListener('scroll', this.positionFrameContainer);
    }
  };

  this.setScrollParent = () => {
    let offsetParent = this.activeName.element;
    let scrollParent = null;

    while (offsetParent.offsetParent) {
      offsetParent = offsetParent.offsetParent;
      scrollParent = (offsetParent.scrollHeight > offsetParent.clientHeight)
        ? offsetParent
        : scrollParent;
    }

    this.scrollParent = offsetParent === document.body ? document.body : scrollParent || offsetParent;
  };

  this.positionFrameContainer = (scrollEvent) => {
    const rect = this.activeName.element.getBoundingClientRect();

    if (!scrollEvent) {
      this.activeName.isInLeftHalf = rect.left < this.getHalfViewWidth();
      this.activeName.isInTopHalf = rect.top < this.getHalfViewHeight();
    }

    this.frameContainer.style.marginLeft = this.activeName.isInLeftHalf ? '0' : '4px';

    const offset = this.getOffsetFromParent(rect);
    this.frameContainer.style.top = offset.top + 'px';
    this.frameContainer.style.left = offset.left + 'px';
    this.frameContainer.hidden = false;
  };

  this.getOffsetFromParent = (rect) => {
    const scrollX = window.scrollX ? window.scrollX : window.pageXOffset;
    const scrollY = window.scrollY ? window.scrollY : window.pageYOffset;

    // 2 pixel left offset to accommodate box shadow of frame's inner elements
    const overlayLeft = this.activeName.isInLeftHalf
      ? rect.left + scrollX - 2
      : rect.left + scrollX - 2 - this.getHalfViewWidth() + rect.width + Math.max(this.getHalfViewWidth() - config.maxFrameContainerWidth, 0);

    const overlayTop = this.activeName.isInTopHalf
      ? rect.top + scrollY + rect.height
      : rect.top + scrollY - this.getHalfViewHeight() + Math.max(this.getHalfViewHeight() - config.maxFrameContainerHeight, 0);

    return {
      left: overlayLeft,
      top: overlayTop
    }
  };

  this.applyAnimationClass = () => {
    this.frameContent.classList.remove('reveal-from-top', 'reveal-from-bottom');

    if (this.activeName.isInTopHalf) {
      this.frameContent.classList.add('reveal-from-top');
    } else {
      this.frameContent.classList.add('reveal-from-bottom');
    }
  };

  this.setFrameLoading = () => {
    this.frameContent.classList.remove('loaded');
    this.frameContent.classList.add('loading');
    this.frameContent.innerHTML = this.statTemplate;
  };

  this.addCloseOverlayListeners = () => {
    this.getFrameDocument().getElementById('dismiss').onclick = this.closeOverlay;
    document.addEventListener('click', this.closeOverlay);
  };

  this.closeOverlay = () => {
    this.activeName.element.onmouseenter = this.handleMouseEnter;
    this.activeName.element.onmouseleave = this.handleMouseLeave;
    this.frameContainer.hidden = true;
    this.scrollParent.removeEventListener('scroll', this.positionFrameContainer);
    document.removeEventListener('click', this.closeOverlay);
    this.getFrameDocument().getElementById('dismiss').onclick = null;
  };

  this.addTabListeners = () => {
    const tabs = this.getFrameDocument().getElementsByClassName('tab');
    for (let tab of tabs) {
      tab.addEventListener('click', this.updateActiveTab)
    }
  };

  this.updateActiveTab = (e) => {
    const tabs = this.getFrameDocument().getElementsByClassName('tab');
    for (let tab of tabs) {
      tab.classList.remove('active');
    }
    e.target.classList.add('active');

    const tables = this.getFrameDocument().getElementsByTagName('table');
    for (let table of tables) {
      table.classList.remove('active');
    }

    const seasonType = e.target.id;
    this.getFrameDocument().getElementById(`${seasonType}-season-table`).classList.add('active');
  };

  this.displayStats = (stats, name) => {
    // catches edge case where user hovers on same name in quick succession, ensures loading graphic displays until data arrives
    if (!this.dataReceived) return;

    this.frameContent.classList.remove('loading');
    this.frameContent.classList.add('loaded');

    if (stats) {
      this.getFrameDocument().getElementById('player-name').textContent = name;
      this.getFrameDocument().getElementById('player-profile-content').innerHTML += stats.profileHTML;

      this.applySeasonTable(stats.regularSeasonHTML, 'regular');
      this.applySeasonTable(stats.postSeasonHTML, 'post');
    }

    if (!this.frameContainer.hidden && stats.regularSeasonHTML.length !== 0) {
      this.checkContentHeight();
    }
  };

  this.applySeasonTable = (careerHTML, seasonType) => {
    const tableBody = this.getFrameDocument().getElementById(`${seasonType}-season-body`);

    if (careerHTML.length) {
      tableBody.innerHTML += this.reverse ? this.reverseCareer(careerHTML) : careerHTML;
    } else {
      tableBody.innerHTML += config.emptyRowString;
    }
  };

  this.reverseCareer = (careerHTML) => {
    return careerHTML.replace(/<tr/g, ',<tr').split(',').reverse().join('');
  };

  this.checkContentHeight = () => {
    const frameContent = this.getFrameDocument().getElementById('content');

    if (frameContent.scrollHeight + config.playerHeaderHeight < (this.getHalfViewHeight()) - 2) {
      frameContent.classList.add('short-career');
    }
  };

  this.getHalfViewHeight = () => {
    return window.innerHeight / 2;
  };

  this.getHalfViewWidth = () => {
    return window.innerWidth / 2;
  };

  this.getFrameDocument = () => {
    return this.frame.contentDocument;
  };

  this.displayNetworkError = () => {
    // hide both loading graphic and content
    this.frameContent.classList.add('loading');
    this.frameContent.classList.add('loaded');
    this.getFrameDocument().getElementById('network-error').hidden = false;
  };

  this.handleReportedEdgeCases = () => {
    /*
    User noted that results in google search carousel do not respond to hover events
    This is due to placeholder element google displays before images and text load in
    The overlay element prevents pointer events within carousel items
     */
    const isGoogleSearchWithCarousel = document.URL.match(/google.*\/search/)
      && document.getElementsByTagName('g-scrolling-carousel');

    if (isGoogleSearchWithCarousel) {
      const overlays = document.getElementsByClassName('y6ZeVb');
      for (let i = 0; i < overlays.length; i++) {
        overlays[i].setAttribute('style', 'pointer-events: none');
      }
    }
  };

  this.teardown = () => {
    this.isRunning = false;

    if (this.observer !== null) {
      this.observer.disconnect();
    }

    if (this.getFrameDocument() && this.getFrameDocument().getElementById('dismiss').onclick !== null) {
      this.closeOverlay();
    }

    this.removeResultNodes();
    window.removeEventListener('yt-navigate-start', this.onYtNavigate);
  };

  this.removeResultNodes = () => {
    const resultNodes = document.getElementsByClassName('click-and-roll-wrapper');

    while (resultNodes.length) {
      const wrapper = resultNodes[0];
      const parent = wrapper.parentNode;
      wrapper.replaceWith(wrapper.firstChild);
      parent.normalize();
    }
  };

}
