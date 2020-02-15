function MessageHandler() {

  this.utils = new Utils();

  this.addListeners = () => {
    const filter = {urls: ['https://stats.nba.com/stats/*']};
    const extraInfoSpec = ['requestHeaders', 'blocking', 'extraHeaders'];

    chrome.webRequest.onBeforeSendHeaders.addListener(this.setRequestHeaders, filter, extraInfoSpec);
    chrome.runtime.onMessage.addListener(this.handleMessage);
    // pass in anon function invoking handleLoad, rather than handleLoad itself, so that we don't pass onActivated result to handleLoad
    chrome.tabs.onActivated.addListener(() => this.handleLoad());
  };

  this.setRequestHeaders = (requestDetails) => {
    let hasReferer = false;
    const newReferer = 'https://stats.nba.com';
    const headers = requestDetails.requestHeaders;

    for (let i = 0; i < headers.length; i++) {
      if (headers[i].name.toLowerCase() === 'referer') {
        headers[i].value = newReferer;
        hasReferer = true;
        break;
      }
    }

    if (!hasReferer) {
      headers.push({name: 'Referer', value: newReferer});
    }

    headers.push({name: 'x-nba-stats-origin', value: 'stats'});
    headers.push({name: 'x-nba-stats-token', value: 'true'});

    return {requestHeaders: headers}
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
    return this.apiGet('commonallplayers', {Season: '2018-19', IsOnlyCurrentSeason: '0'})
      .then(response => {
        sendResponse([null, this.formatPlayers(response)]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  };

  this.apiGet = (endpoint, params) => {
    const data = {LeagueID: '00', ...params};
    return $.ajax(`https://stats.nba.com/stats/${endpoint}`,
      {
        method: 'GET',
        data,
        cache: false
      })
  };

  this.formatPlayers = (response) => {
    return response.resultSets[0].rowSet.map((player) => {
      return {
        id: player[0],
        name: player[2]
      }
    });
  };

  this.handleFetchStats = (request, sendResponse) => {
    let cacheRecords;
    const id = request.playerId;

    return this.getCacheRecords()
      .then(result => {
        cacheRecords = result;
        return this.areStatsInCacheAndCurrent(cacheRecords, id)
          ? this.utils.getFromLocalStorage(`player-${id}`)
          : this.fetchNonCachedStats(id);
      })
      .then(stats => {
        this.cacheStats(stats, id, cacheRecords);
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

  this.areStatsInCacheAndCurrent = (cacheRecords,id) => {
    const player = cacheRecords.filter(player => player.id === id)[0] || null;
    return player !== null && Date.now() - player.timestamp < (3 * 60 * 60 * 1000);
  };

  this.fetchNonCachedStats = (id) => {
    const stats = {id};

    return this.applyRateLimit()
      .then(() => {
        this.utils.saveToLocalStorage('timestamp', Date.now());
        return this.apiGet('playerCareerStats', {PerMode: 'PerGame', PlayerID: id});
      })
      .then(response => {
        stats.careerHTML = this.getCareerHTML(response);
        return this.apiGet('commonplayerinfo', {PlayerID: id});
      })
      .then(response => {
        return this.getProfileHTML(response);
      })
      .then(profileHTML => {
        stats.profileHTML = profileHTML;
        return stats;
      })
  };

  this.cacheStats = (stats, id, records) => {
    const newRecord = [{id, timestamp: Date.now()}];
    this.utils.saveToLocalStorage(`player-${id}`, stats);
    this.utils.saveToLocalStorage('cache-records', records.filter(player => player.id !== id).concat(newRecord));
  };

  this.applyRateLimit = () => {
    return this.utils.getFromLocalStorage('timestamp')
      .then(timestamp => {
        return new Promise(resolve => {
          const timeout = Math.max(0, 3000 - (Date.now() - timestamp));
          setTimeout(resolve, timeout);
        });
      });
  };

  this.getCareerHTML = (response) => {
    const seasons = response.resultSets.filter(resultSet => resultSet.name === 'SeasonTotalsRegularSeason')[0];
    const career = response.resultSets.filter(resultSet => resultSet.name === 'CareerTotalsRegularSeason')[0];
    const allStar = response.resultSets.filter(resultSet => resultSet.name === 'SeasonTotalsAllStarSeason')[0];
    const allStarSeasons = allStar.rowSet.map(row => row[allStar.headers.indexOf('SEASON_ID')]);

    let careerStatsHTML = '';

    if (seasons.rowSet.length) {
      for (let i = 0; i < seasons.rowSet.length; i++) {
        const season = seasons.rowSet[i];
        const isAllStarSeason = allStarSeasons.indexOf(season[1]) !== -1;
        const rowHTML = this.createRow(season, isAllStarSeason, false);
        careerStatsHTML += rowHTML;
      }

      const careerRow = this.createRow(career.rowSet[0], false, true);
      careerStatsHTML += careerRow;
    }

    return careerStatsHTML;
  };

  this.createRow = (season, isAllStarSeason, isCareerRow) => {
    if (isCareerRow) {
      season[0] = 'Career';
      season[1] = season[2] = '-';
    } else {
      const statsToRemove = [3, 2, 0];
      for (let i = 0; i < statsToRemove.length; i++) {
        season.splice(statsToRemove[i], 1);
      }
    }

    let tableDataCells = '';

    for (let i = 0; i < season.length; i++) {
      const statContent = (season[i] === null) ? 'n/a' : season[i];
      const allStarSeasonSpan = '<span style="color:gold; padding-left: 8px">&#9733;</span>';

      const statHtml = i === 0
        ? '<td class="season stick-left">' + statContent + (isAllStarSeason ? allStarSeasonSpan : '') + '</td>'
        : '<td>' + statContent + '</td>';

      tableDataCells += statHtml;
    }

    return '<tr' + (isCareerRow ? ' class="career">' : '>') + tableDataCells + '</tr>';
  };

  this.getProfileHTML = (response) => {
    const headers = response.resultSets[0].headers;
    const profileData = response.resultSets[0].rowSet[0];

    const getProfileValue = (key) => {
      return profileData[headers.indexOf(key)];
    };

    const formattedProfile = [{
        label: 'Team',
        value: getProfileValue('TEAM_ABBREVIATION') || 'n/a'
      },
      {
        label: 'Birthday',
        value: this.formatBirthday(getProfileValue('BIRTHDATE'))
      },
      {
        label: 'Country',
        value: getProfileValue('COUNTRY') || 'n/a'
      },
      {
        label: 'Number',
        value: getProfileValue('JERSEY') || 'n/a'
      },
      {
        label: 'Height',
        value: getProfileValue('HEIGHT') || 'n/a'
      },
      {
        label: 'College',
        value: getProfileValue('SCHOOL') || 'n/a'
      },
      {
        label: 'Position',
        value: getProfileValue('POSITION') || 'n/a'
      },
      {
        label: 'Weight',
        value: this.formatWeight(getProfileValue('WEIGHT'))
      },
      {
        label: 'Draft',
        value: this.formatDraft(getProfileValue('DRAFT_YEAR'), getProfileValue('DRAFT_ROUND'), getProfileValue('DRAFT_NUMBER'))
    }];

    let profileHTML = '';
    const fullName = getProfileValue('DISPLAY_FIRST_LAST');
    const imageUrl = this.getPlayerImageUrl(fullName);

    const mapProfileValues = () => {
      profileHTML += '<div id="player-profile-info">';

      for (let i = 0; i < formattedProfile.length; i++) {
        profileHTML += '<div class="info-label">' + formattedProfile[i].label + '</div>';
        profileHTML += '<div class="info-data">' + formattedProfile[i].value + '</div>';
      }

      profileHTML += '</div>';
    };

    return fetch(imageUrl, {cache: 'force-cache', redirect: 'error'})
      .then(() => {
        profileHTML += '<img src ="' + imageUrl + '" alt="' + fullName + '" id="player-profile-image"/>';
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
