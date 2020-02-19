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

    return this.getPlayers()
      .then(players => {
        this.players = players.concat(nicknameMap);
        return $.ajax(chrome.extension.getURL('view/frame.html'), {method: 'GET'});
      })
      .then(response => {
        this.statTemplate = response;
        return $.ajax(chrome.extension.getURL('view/frame.css'), {method: 'GET'})
      })
      .then(response => {
        this.frameStyle = response;

        const playerNames = this.players.map((player) => player.name);

        this.resultSearch.setSearchStrings(playerNames);
        const resultNodes = this.resultSearch.searchRootNode(document.body);

        this.highlight(resultNodes);
        this.handleReportedEdgeCases();
        this.observeMutations();
      });
  };

  this.getPlayers = () => {
    return this.utils.getFromLocalStorage('players')
      .then(players => {
        if (players) return Promise.resolve(players);
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
      node.onmouseenter = this.handleHover;
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

  this.handleHover = (mouseEnterEvent) => {
    this.updateActiveName(mouseEnterEvent.target);
    this.resetFrame();

    const newPlayerId = this.players.filter(player => player.name === this.activeName.element.textContent)[0].id;
    const isNetworkErrorShowing = this.getFrameDocument().getElementById('network-error')
      && !this.getFrameDocument().getElementById('network-error').hidden;

    if (newPlayerId !== this.currentPlayerId || isNetworkErrorShowing) {
      this.setFrameLoading(newPlayerId);
      this.addCloseOverlayListeners();
      return this.utils.sendRuntimeMessage({message: 'fetchStats', playerId: this.currentPlayerId})
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
    } else {
      this.addCloseOverlayListeners();
      this.displayStats();
    }
  };

  this.updateActiveName = (target) => {
    // reapply handle hover to previous element
    if (this.activeName.element) {
      this.activeName.element.onmouseenter = this.handleHover
    }
    this.activeName.element = target;
    this.activeName.element.onmouseenter = null;
  };

  this.resetFrame = () => {
    this.attachFrame();
    this.applyScrollRule();
    this.applyFrameStyles();
    this.getFrameDocument().body.innerHTML = '';
    this.positionFrameContainer();
    this.applyAnimationClass();
    this.getFrameDocument().body.appendChild(this.frameContent);
  };

  this.attachFrame = () => {
    if (this.frameContainer.parentNode) this.frameContainer.parentNode.removeChild(this.frameContainer);
    document.body.appendChild(this.frameContainer);
    this.frameContainer.appendChild(this.frame);
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
      : rect.left + scrollX - 2 - this.getHalfViewWidth() + rect.width + Math.max(this.getHalfViewWidth() - 800, 0);

    const overlayTop = this.activeName.isInTopHalf
      ? rect.top + scrollY + rect.height
      : rect.top + scrollY - this.getHalfViewHeight();

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

  this.setFrameLoading = (newPlayerId) => {
    this.frameContent.classList.remove('loaded');
    this.frameContent.classList.add('loading');
    this.frameContent.innerHTML = this.statTemplate;
    this.currentPlayerId = newPlayerId;
    this.dataReceived = false;
  };

  this.addCloseOverlayListeners = () => {
    this.getFrameDocument().getElementById('dismiss').onclick = this.closeOverlay;
    document.addEventListener('click', this.closeOverlay);
  };

  this.closeOverlay = () => {
    this.activeName.element.onmouseenter = this.handleHover;
    this.frameContainer.hidden = true;
    this.scrollParent.removeEventListener('scroll', this.positionFrameContainer);
    document.removeEventListener('click', this.closeOverlay);
    this.getFrameDocument().getElementById('dismiss').onclick = null;
  };

  this.displayStats = (stats, name) => {
    // catches edge case where user hovers on same name in quick succession, ensures loading graphic displays until data arrives
    if (!this.dataReceived) return;

    this.frameContent.classList.remove('loading');
    this.frameContent.classList.add('loaded');

    if (stats) {
      this.getFrameDocument().getElementById('player-name').textContent = name;
      this.getFrameDocument().getElementById('player-profile-content').innerHTML += stats.profileHTML;

      if (stats.careerHTML.length) {
        this.getFrameDocument().getElementById('season-averages-body').innerHTML += stats.careerHTML;
      } else {
        this.getFrameDocument().getElementById('content').removeChild(this.getFrameDocument().getElementById('career-heading'));
        this.getFrameDocument().getElementById('content').removeChild(this.getFrameDocument().getElementById('career-stats'));
      }
    }

    if (!this.frameContainer.hidden) {
      this.checkContentHeight();
    }
  };

  this.checkContentHeight = () => {
    const frameContent = this.getFrameDocument().getElementById('content');
    const playerHeaderHeight = 37;

    if (frameContent.scrollHeight + playerHeaderHeight < (this.getHalfViewHeight()) - 2) {
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

    const resultNodes = document.getElementsByClassName('click-and-roll-wrapper');

    while (resultNodes.length) {
      const wrapper = resultNodes[0];
      wrapper.replaceWith(wrapper.firstChild);
    }
  };

}
