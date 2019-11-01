function MessageHandler() {

  this.addListener = () => {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  };

  this.handleMessage = (request, sender, sendResponse) => {
    switch (request.message) {
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
        stats.career = this.formatCareerStats(response);
        return this.fetchCommonPlayerInfo(request.playerId);
      })
      .then(response => {
        stats.profile = this.formatPlayerProfile(response);
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

  this.formatCareerStats = (response) => {
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

  this.formatPlayerProfile = (response) => {
    const headers = response.resultSets[0].headers;
    const profileData = response.resultSets[0].rowSet[0];

    const getProfileValue = (key) => {
      return profileData[headers.indexOf(key)];
    };

    return {
      draft: this.formatDraft(getProfileValue('DRAFT_YEAR'), getProfileValue('DRAFT_ROUND'), getProfileValue('DRAFT_NUMBER')),
      birthday: this.formatBirthday(getProfileValue('BIRTHDATE')),
      weight: this.formatWeight(getProfileValue('WEIGHT')),
      team: getProfileValue('TEAM_ABBREVIATION') || 'n/a',
      number: getProfileValue('JERSEY') || 'n/a',
      position: getProfileValue('POSITION') || 'n/a',
      height: getProfileValue('HEIGHT') || 'n/a',
      country: getProfileValue('COUNTRY') || 'n/a',
      college: getProfileValue('SCHOOL') || 'n/a',
      imageUrl: this.getPlayerImageUrl(getProfileValue('DISPLAY_FIRST_LAST'))
    };
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
  }

}
