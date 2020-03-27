function MessageHandler() {

  this.utils = new Utils();

  this.addListeners = () => {
    // pass in anon function invoking handleLoad, rather than handleLoad itself, so that we don't pass onActivated result to handleLoad
    chrome.tabs.onActivated.addListener(() => this.handleLoad());
    chrome.runtime.onMessage.addListener(this.handleMessage);
  };

  this.handleMessage = (request, sender, sendResponse) => {
    switch (request.message) {
      case 'load':
        this.handleLoad(sendResponse);
        return true;
      case 'fetchPlayers':
        this.handleFetchPlayers(sendResponse);
        return true;
      case 'fetchStats':
        this.handleFetchStats(request, sendResponse);
        return true;
      default:
        return false;
    }
  };

  this.handleLoad = (sendResponse) => {
    let activeTab;
    return this.utils.getActiveTab()
      .then(tab => {
        activeTab = tab;
        return this.utils.isExtensionOn(this.utils.getTabUrl(activeTab));
      })
      .then(isExtensionOnForDomain => {
        if (isExtensionOnForDomain) {
          this.utils.messageActiveTab({message: 'start'});
          chrome.browserAction.setIcon({path: '../assets/static/active32.png', tabId: activeTab.id});
        } else {
          this.utils.messageActiveTab({message: 'stop'});
          chrome.browserAction.setIcon({path: '../assets/static/inactive32.png', tabId: activeTab.id});
        }
        if (sendResponse) sendResponse([null, null]);
      });
  };

  this.handleFetchPlayers = (sendResponse) => {
    this.utils.saveToLocalStorage('players-timestamp', Date.now());
    return this.apiGet('players', 'all')
      .then(response => {
        sendResponse([null, response]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  };

  this.apiGet = (endpoint, id) => {
    return $.ajax(`http://clickandroll.co.uk/api/${endpoint}/${id}`,
      {
        method: 'GET',
        headers: {'x-click-and-roll': 'true'},
        cache: false,
        timeout: 10000
      })
  };

  this.handleFetchStats = (request, sendResponse) => {
    let cacheRecords;
    const id = request.playerId;

    return this.getCacheRecords()
      .then(result => {
        cacheRecords = result;
        return this.statsInCacheAndCurrent(cacheRecords, id)
          ? this.utils.getFromLocalStorage(`player-${id}`)
          : this.fetchNonCachedStats(id);
      })
      .then(stats => {
        if (!this.statsInCacheAndCurrent(cacheRecords, id)) {
          this.cacheStats(stats, id, cacheRecords);
        }
        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  };

  this.getCacheRecords = () => {
    return this.utils.getFromLocalStorage('cache-records')
      .then(cacheRecords => {
        if (!cacheRecords) {
          this.utils.saveToLocalStorage('cache-records', []);
          return [];
        }
        return cacheRecords.length >= 100 ? this.cleanCache(cacheRecords) : cacheRecords;
      });
  };

  this.cleanCache = (cacheRecords) => {
    cacheRecords.splice(0, Math.floor(cacheRecords.length / 2)).map(record => {
      this.utils.removeFromLocalStorage(`player-${record.id}`)
    });
    return cacheRecords;
  };

  this.statsInCacheAndCurrent = (cacheRecords, id) => {
    const player = cacheRecords.filter(player => player.id === id)[0] || null;
    return player !== null && (!player.active || Date.now() - player.timestamp < (3 * 60 * 60 * 1000));
  };

  this.fetchNonCachedStats = (id) => {
    const stats = {id};

    return this.applyRateLimit()
      .then(() => {
        this.utils.saveToLocalStorage('timestamp', Date.now());
        return this.apiGet('player', id);
      })
      .then(response => {
        stats.active = this.getActive(response.rows);
        stats.careerHTML = this.getCareerHTML(response.rows);
        return this.getProfileHTML(response.profile);
      })
      .then(profileHTML => {
        stats.profileHTML = profileHTML;
        return stats;
      })
  };

  this.cacheStats = (stats, id, records) => {
    const newRecord = [{id, timestamp: Date.now(), active: stats.active}];
    this.utils.saveToLocalStorage(`player-${id}`, stats);
    this.utils.saveToLocalStorage('cache-records', records.filter(player => player.id !== id).concat(newRecord));
  };

  this.applyRateLimit = () => {
    return this.utils.getFromLocalStorage('timestamp')
      .then(timestamp => {
        return new Promise(resolve => {
          const timeout = Math.max(0, 1000 - (Date.now() - timestamp));
          setTimeout(resolve, timeout);
        });
      });
  };

  this.getActive = (rows) => {
    const lastActiveSeason = rows[rows.length - 2];
    const lastActiveYear = parseInt(lastActiveSeason['SEASON_ID'].slice(0,4));
    const currentYear = new Date().getFullYear();

    return lastActiveYear >= currentYear - 1;
  };

  this.getCareerHTML = (rows) => {
    let careerStatsHTML = '';

    if (rows.length) {
      for (let i = 0; i < rows.length - 1; i++) {
        const season = rows[i];
        const rowHTML = this.createRow(season, false);
        careerStatsHTML += rowHTML;
      }

      const careerRow = this.createRow(rows[rows.length - 1], true);
      careerStatsHTML += careerRow;
    }

    return careerStatsHTML;
  };

  this.createRow = (season, isCareerRow) => {
    const allStarSeasonSpan = '<span style="color:gold; padding-left: 8px">&#9733;</span>';
    const countingStats = ['GP','MIN','FGM','FGA','FG_PCT','FG3M','FG3A','FG3_PCT','FTM','FTA','FT_PCT','OREB','DREB','REB','AST','STL','BLK','TOV','PF','PTS'];

    let tableDataCells = `<td class="season stick-left">${season['SEASON_ID']}`
      + `${season['ALL_STAR'] ? allStarSeasonSpan : ''}</td>`
      + `<td>${isCareerRow ? '-' : season['TEAM_ABBREVIATION']  || 'n/a'}</td>`
      + `<td>${isCareerRow ? '-' : season['PLAYER_AGE']         || 'n/a'}</td>`;

    for (let stat of countingStats) {
      tableDataCells += `<td>${this.parseRawStatToDisplayString(season[stat], stat.indexOf('PCT') !== -1)}</td>`
    }

    return '<tr' + (isCareerRow ? ' class="career">' : '>') + tableDataCells + '</tr>';
  };

  this.parseRawStatToDisplayString = (rawStat, isPct) => {
    let displayString = `${rawStat === 0 ? 0 : (rawStat || 'n/a')}`;
    if (isPct && displayString !== 'n/a') {
      switch (displayString) {
        case '1':
          displayString = '1.000';
          break;
        case '0':
          displayString = '.000';
          break;
        default:
          displayString = displayString.padEnd(5, '0').substring(1);
      }
    }
    return displayString;
  };

  this.getProfileHTML = (profile) => {

    const formattedProfile = [{
        label: 'Team',
        value: profile['TEAM_ABBREVIATION'] || 'n/a'
      },
      {
        label: 'Birthday',
        value: this.formatBirthday(profile['BIRTHDAY'])
      },
      {
        label: 'Country',
        value: profile['COUNTRY'] || 'n/a'
      },
      {
        label: 'Number',
        value: profile['NUMBER'] || 'n/a'
      },
      {
        label: 'Height',
        value: profile['HEIGHT'] || 'n/a'
      },
      {
        label: 'College',
        value: profile['COLLEGE'] || 'n/a'
      },
      {
        label: 'Position',
        value: profile['POSITION'] || 'n/a'
      },
      {
        label: 'Weight',
        value: this.formatWeight(profile['WEIGHT'])
      },
      {
        label: 'Draft',
        value: this.formatDraft(profile['DRAFT_YEAR'], profile['DRAFT_ROUND'], profile['DRAFT_NUMBER'])
    }];

    let profileHTML = '';
    const fullName = profile['NAME'];
    const imageUrl = this.getPlayerImageUrl(fullName);

    const mapProfileValues = () => {
      profileHTML += '<div id="player-profile-info">';

      for (let i = 0; i < formattedProfile.length; i++) {
        profileHTML += `<div class="info-label">${formattedProfile[i].label}</div>`;
        profileHTML += `<div class="info-data">${formattedProfile[i].value}</div>`;
      }

      profileHTML += '</div>';
    };

    return fetch(imageUrl, {cache: 'force-cache', redirect: 'error'})
      .then(() => {
        profileHTML += `<img src ="${imageUrl}" alt="${fullName}" id="player-profile-image"/>`;
        mapProfileValues();
        return profileHTML;
      })
      .catch(() => {
        profileHTML += '<img src ="https://cdn.clipart.email/3cd6f4d8f61a5da065d31bc13bbd4d5b_generic-silhouette-at-getdrawingscom-free-for-personal-use-_600-600.jpeg" alt="Generic Silhouette" id="player-profile-image"/>';
        mapProfileValues();
        return profileHTML;
      });
  };

  this.formatDraft = (draftYear, draftRound, draftNumber) => {
    if (draftYear) {
      return (draftYear === 'Undrafted')
        ? draftYear
        : draftYear + ', Round ' + draftRound
        + ', Pick ' + draftNumber;
    } else {
      return 'n/a';
    }
  };

  this.formatBirthday = (birthday) => {
    return birthday ? birthday.split('T')[0] : 'n/a'
  };

  this.formatWeight = (weight) => {
    return weight ? weight + ' lb' : 'n/a';
  };

  this.getPlayerImageUrl = (fullName) => {
    const names = fullName.replace('-', '').replace('\'', '').split(' ');
    const surNameAbb = names[names.length - 1].slice(0, 5).toLowerCase();
    const firstNameAbb = names[0].slice(0, 2).toLowerCase();
    const imageRef = Object.getOwnPropertyNames(playerImageRefMap).includes(fullName)
      ? playerImageRefMap[fullName]
      : '01';

    return 'https://d2cwpp38twqe55.cloudfront.net/req/' + this.getDateString(new Date()) + '1/images/players/' + surNameAbb + firstNameAbb + imageRef + '.jpg';
  };

  this.getDateString = (date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1 < 10)
      ? '0' + (date.getMonth() + 1)
      : date.getMonth() + 1;
    const day = (date.getDate() < 10)
      ? '0' + (date.getDate())
      : date.getDate();
    return year + month + day;
  };

}
