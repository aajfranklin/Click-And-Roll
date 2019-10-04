function ClickAndRoll(players) {
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
  this.players = players;
  this.resultSearch = new ResultSearch();

  this.utils = new Utils();

  this.run = () => {
    $.ajax(chrome.extension.getURL('view/frame.html'), {method: 'GET'})
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
        this.observeMutations();
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

    const observer = new MutationObserver(() => {
      if (this.bodyText !== document.body.textContent) {
        this.bodyText = document.body.textContent;
        const resultNodes = this.resultSearch.searchRootNode(document.body);

        observer.disconnect();
        this.highlight(resultNodes);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  this.handleHover = (mouseEnterEvent) => {
    this.updateActiveName(mouseEnterEvent.target);
    this.resetFrame();

    const newPlayerId = this.players.filter(player => player.name === this.activeName.element.textContent)[0].id;

    if (newPlayerId !== this.currentPlayerId) {
      this.setFrameLoading(newPlayerId);
      this.addCloseOverlayListeners();
      this.utils.sendRuntimeMessage({message: 'fetchStats', playerId: this.currentPlayerId})
        .then(stats => {
          // current player id may have been reassigned by a later hover, making these stats out of date
          if (newPlayerId === this.currentPlayerId) {
            this.dataReceived = true;
            this.displayStats(stats, this.activeName.element.textContent)
          }
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
    if (this.frameContainer.parentNode !== this.getNewContainerParent()) {
      this.assignContainerToNewParent();
    }

    this.frameContainer.style.height = 'calc(50vh + 2px)';
    this.getFrameDocument().body.innerHTML = '';
    this.positionFrameContainer();
    this.getFrameDocument().body.appendChild(this.frameContent);
  };

  this.getNewContainerParent = () => {
    let rootOffsetParent = this.activeName.element;
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

  this.assignContainerToNewParent = () => {
    if (this.frameContainer.parentNode) {
      this.frameContainer.parentNode.removeChild(this.frameContainer);
    }

    this.getNewContainerParent().appendChild(this.frameContainer);
    this.frameContainer.appendChild(this.frame);

    this.getFrameDocument().body.id = 'frame-body';

    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = this.frameStyle;
    style.title = 'click-and-roll';
    this.getFrameDocument().head.appendChild(style);
  };

  this.positionFrameContainer = () => {
    const rect = this.activeName.element.getBoundingClientRect();
    this.activeName.isInLeftHalf= rect.left < this.getHalfViewWidth();
    this.activeName.isInTopHalf = rect.top < this.getHalfViewHeight();

    this.frameContainer.style.marginLeft = this.activeName.isInLeftHalf ? '0' : '4px';

    // remove existing animation class
    this.frameContent.classList.remove('reveal-from-top', 'reveal-from-bottom');

    if (this.activeName.isInTopHalf) {
      this.frameContent.classList.add('reveal-from-top');
    } else {
      this.frameContent.classList.add('reveal-from-bottom');
    }

    const offset = this.getOffsetFromParent(rect);
    this.frameContainer.style.top = offset.top + 'px';
    this.frameContainer.style.left = offset.left + 'px';
    this.frameContainer.hidden = false;
  };

  this.getOffsetFromParent = (rect) => {
    const scrollX = (this.frameContainer.parentNode === document.body)
      ? (window.scrollX ? window.scrollX : window.pageXOffset)
      : this.frameContainer.parentNode.scrollLeft;
    const scrollY = (this.frameContainer.parentNode === document.body)
      ? (window.scrollY ? window.scrollY : window.pageYOffset)
      : this.frameContainer.parentNode.scrollTop;

    const parentOffset = {
      x: (this.frameContainer.parentNode === document.body) ? 0 : this.frameContainer.parentNode.getBoundingClientRect().left,
      y: (this.frameContainer.parentNode === document.body) ? 0 : this.frameContainer.parentNode.getBoundingClientRect().top
    };

    // 2 pixel left offset to accommodate box shadow of frame's inner elements
    const overlayLeft = this.activeName.isInLeftHalf
      ? rect.left + scrollX - parentOffset.x - 2
      : rect.left + scrollX - parentOffset.x - 2 - this.getHalfViewWidth() + rect.width + Math.max(this.getHalfViewWidth() - 800, 0);

    const overlayTop = this.activeName.isInTopHalf
      ? rect.top + scrollY - parentOffset.y + rect.height
      : rect.top + scrollY - parentOffset.y - this.getHalfViewHeight();

    return {
      left: overlayLeft,
      top: overlayTop
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
    document.removeEventListener('click', this.closeOverlay);
  };

  this.displayStats = (stats, name) => {
    // catches edge case where user hovers on same name in quick succession, ensures loading graphic displays until data arrives
    if (!this.dataReceived) return;

    this.frameContent.classList.remove('loading');
    this.frameContent.classList.add('loaded');

    if (stats) {
      this.getFrameDocument().getElementById('player-name').textContent = name;
      this.mapPlayerProfile(stats.profile, name);
      this.mapStatsToRows(stats.career);
    }

    if (!this.frameContainer.hidden) {
      this.resizeFrameContent();
    }
  };

  this.mapPlayerProfile = (profile, name) => {
    const profileImageElement = this.getFrameDocument().getElementById('player-profile-image');

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
      const infoDataElement = this.getFrameDocument().getElementById('info-' + profileInfoDetails[i]);
      infoDataElement.textContent = profile[profileInfoDetails[i]];
    }
  };

  this.mapStatsToRows = (stats) => {
    if (stats.seasons.rowSet.length === 0) {
      this.getFrameDocument().getElementById('content').removeChild(this.getFrameDocument().getElementById('career-heading'));
      this.getFrameDocument().getElementById('content').removeChild(this.getFrameDocument().getElementById('table-container'));
    }

    for (let i = 0; i < stats.seasons.rowSet.length; i++) {
      const season = stats.seasons.rowSet[i];
      const row = this.createRow(season, stats.allStarSeasons.indexOf(season[1]) !== -1, false);
      this.getFrameDocument().getElementById('season-averages-body').appendChild(row);
    }

    if (stats.career.rowSet.length !== 0) {
      const careerRow = this.createRow(stats.career.rowSet[0], false, true);
      careerRow.classList.add('career');
      this.getFrameDocument().getElementById('season-averages-body').appendChild(careerRow);
    }
  };

  this.createRow = (season, isAllStarSeason, isCareerRow) => {
    if (isCareerRow) {
      season[0] = 'Career';
      season[1] = season[2] = '-';
    } else {
      const statsToRemove = [3, 2, 0];
      for (let j = 0; j < statsToRemove.length; j++) {
        season.splice(statsToRemove[j], 1);
      }
    }

    const row = this.getFrameDocument().createElement('tr');

    for (let k = 0; k < season.length; k++) {
      const stat = this.getFrameDocument().createElement('td');
      stat.textContent = (season[k] === null)
        ? 'n/a'
        : season[k];
      if (k === 0) {
        stat.classList.add('season');
        stat.classList.add('stick-left');
        stat.innerHTML += isAllStarSeason
          ? '<span style="color:gold; padding-left: 8px">&#9733;</span>'
          : '';
      }
      row.appendChild(stat)
    }

    return row;
  };

  this.resizeFrameContent = () => {
    const frameContent = this.getFrameDocument().getElementById('content');
    const playerHeaderHeight = 37;

    if (frameContent.scrollHeight + playerHeaderHeight < (this.getHalfViewHeight()) - 2) {
      this.frameContent.classList.remove('reveal-from-top', 'reveal-from-bottom');
      const newHeight = (frameContent.scrollHeight + playerHeaderHeight) + 'px';

      const rule = this.activeName.isInTopHalf
        ? '@keyframes resize{from{height:calc(100vh - 2px);}'
          + 'to{height:' + newHeight + ';}}'
        : '@keyframes resize{from{height:calc(100vh - 2px);margin-top:0;;}'
          + 'to{height:' + newHeight + ';margin-top:calc(100vh - 2px - ' + newHeight + ');}}';

      // if user has scrolled over multiple names in quick succession, existing resize rule and event listeners should be removed
      this.removeResizeAnimation();
      this.frameContent.removeEventListener('animationend', this.handleAnimationEnd);

      this.getStyleSheet().insertRule(rule, 0);
      this.frameContent.addEventListener('animationend', this.handleAnimationEnd);
      this.frameContent.classList.add('resize');
    }
  };

  this.handleAnimationEnd = (animationEvent) => {
    if (animationEvent.animationName === 'resize') {
      this.removeResizeAnimation();
      this.frameContent.classList.remove('resize');
      this.frameContent.removeEventListener('animationend', this.handleAnimationEnd);

      const frameContentHeight = this.frameContent.scrollHeight + 2;
      this.frameContainer.style.height = frameContentHeight + 'px';
      this.frameContainer.style.top = this.activeName.isInTopHalf
        ? this.frameContainer.style.top
        : this.frameContainer.offsetTop + this.getHalfViewHeight() - frameContentHeight + 'px';
    }
  };

  this.removeResizeAnimation = () => {
    const stylesheet = this.getStyleSheet();
    const resizeRules = Array.prototype.filter.call(stylesheet.rules, rule => rule.name === 'resize');
    for (let i = 0; i < resizeRules.length; i++) {
      stylesheet.deleteRule(Array.prototype.indexOf.call(stylesheet.rules, resizeRules[i]));
    }
  };

  this.getHalfViewHeight = () => {
    return window.innerHeight / 2;
  };

  this.getHalfViewWidth = () => {
    return window.innerWidth / 2;
  };

// ensures we always manipulate the correct style sheet if others are injected in iFrame e.g. by another extension
  this.getStyleSheet = () => {
    return Array.prototype.filter.call(this.getFrameDocument().styleSheets, stylesheet => {
      return stylesheet.title === 'click-and-roll';
    })[0];
  };

  this.getFrameDocument = () => {
    return this.frame.contentDocument;
  };

}
