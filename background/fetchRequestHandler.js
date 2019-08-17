function FetchRequestHandler() {

  this.addListeners = () => {
    chrome.runtime.onMessage.addListener(this.onFetchPlayers);
    chrome.runtime.onMessage.addListener(this.onFetchStats);
  };

  this.onFetchPlayers = (request, sender, sendResponse) => {
    if (request.message === 'fetchPlayers') {
      this.fetchPlayers()
        .then(response => {
          sendResponse([null, this.formatPlayers(response)]);
        })
        .catch(err => {
          sendResponse([err, null]);
        });
    }
    return true;
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

  this.onFetchStats = (request, sender, sendResponse) => {
    if (request.message === 'fetchStats') {

      const stats = {id: request.playerId};

      this.fetchCareerStats(request.playerId)
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
    }
    return true
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
    return {seasons, career, allStarSeasons};
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
      team: this.formatTeam(getProfileValue('TEAM_NAME'), getProfileValue('TEAM_CITY')),
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

  this.formatTeam = (teamName, city) => {
    return (teamName && city) ? city.charAt(0).toUpperCase() + city.slice(1) + ' ' + teamName : 'n/a';
  };

  this.getPlayerImageUrl = (fullName) => {
    const names = fullName.replace('-', '').replace('\'', '').split(' ');
    const surNameAbb = names[names.length - 1].slice(0, 5).toLowerCase();
    const firstNameAbb = names[0].slice(0, 2).toLowerCase();
    const imageRef = Object.getOwnPropertyNames(playerImageRefMap).includes(fullName)
      ? playerImageRefMap[fullName]
      : '01';

    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1 < 10)
      ? '0' + (date.getMonth() + 1)
      : date.getMonth().toString();
    const day = date.getDate().toString();
    const dateStr = year + month + day + '1';

    return 'https://d2cwpp38twqe55.cloudfront.net/req/' + dateStr + '/images/players/' + surNameAbb + firstNameAbb + imageRef + '.jpg';
  };

}
