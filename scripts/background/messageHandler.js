function MessageHandler() {

  this.utils = new Utils();

  this.addListener = () => {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  };

  this.handleMessage = (request, sender, sendResponse) => {
    switch (request.message) {
      case 'load':
        this.handleLoad();
        return false;
      case 'fetchPlayers':
        this.handleFetchPlayers(request, sender, sendResponse);
        return true;
      case 'fetchStats':
        this.handleFetchStats(request, sender, sendResponse);
        return true;
      default:
        return false;
    }
  };

  this.handleLoad = () => {
    let activeTab;
    return this.utils.getActiveTab()
      .then(tab => {
        activeTab = tab;
        return this.utils.isExtensionOn((new URL(activeTab.url)).hostname);
      })
      .then(isExtensionOnForDomain => {
        if (isExtensionOnForDomain) {
          this.utils.messageActiveTab({message: 'start'});
          chrome.browserAction.setIcon({path: '../assets/active32.png', tabId: activeTab.id});
        } else {
          this.utils.messageActiveTab({message: 'stop'});
          chrome.browserAction.setIcon({path: '../assets/inactive32.png', tabId: activeTab.id});
        }
      });
  };

  this.handleFetchPlayers = (request, sender, sendResponse) => {
    return this.fetchPlayers()
      .then(response => {
        sendResponse([null, this.formatPlayers(response)]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  };

  this.fetchPlayers = () => {
    return $.ajax('https://stats.nba.com/stats/commonallplayers',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          Season: '2018-19',
          IsOnlyCurrentSeason: '0'
        }
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

  this.handleFetchStats = (request, sender, sendResponse) => {
    const stats = {id: request.playerId};

    return this.fetchCareerStats(request.playerId)
      .then(response => {
        stats.careerHTML = this.getCareerHTML(response);
        return this.fetchCommonPlayerInfo(request.playerId);
      })
      .then(response => {
        return this.getProfileHTML(response);
      })
      .then(profileHTML => {
        stats.profileHTML = profileHTML;
        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  };

  this.fetchCareerStats = (playerId) => {
    return $.ajax('https://stats.nba.com/stats/playercareerstats',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          PerMode: 'PerGame',
          PlayerID: playerId
        }
      })
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

  this.fetchCommonPlayerInfo = (playerId) => {
    return $.ajax('https://stats.nba.com/stats/commonplayerinfo',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          PlayerID: playerId
        }
      })
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
