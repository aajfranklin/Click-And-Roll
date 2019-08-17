const addListeners = () => {
  chrome.runtime.onMessage.addListener(onFetchPlayers);
  chrome.runtime.onMessage.addListener(onFetchStats);
};

const onFetchPlayers = (request, sender, sendResponse) => {
  if (request.message === 'fetchPlayers') {
    fetchPlayers()
      .then(response => {
        sendResponse([null, formatPlayers(response)]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true;
};

const fetchPlayers = () => {
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

const formatPlayers = (response) => {
  return response.resultSets[0].rowSet.map((player) => {
    return {
      id: player[0],
      name: player[2]
    }
  });
};

const onFetchStats = (request, sender, sendResponse) => {
  if (request.message === 'fetchStats') {

    const stats = {id: request.playerId};

    fetchCareerStats(request.playerId)
      .then(response => {
        stats.career = formatCareerStats(response);
        return fetchCommonPlayerInfo(request.playerId);
      })
      .then(response => {
        stats.profile = formatPlayerProfile(response);
        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true
};

const fetchCareerStats = (playerId) => {
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

const formatCareerStats = (response) => {
  const seasons = response.resultSets.filter(resultSet => resultSet.name === 'SeasonTotalsRegularSeason')[0];
  const career = response.resultSets.filter(resultSet => resultSet.name === 'CareerTotalsRegularSeason')[0];
  const allStar = response.resultSets.filter(resultSet => resultSet.name === 'SeasonTotalsAllStarSeason')[0];
  const allStarSeasons = allStar.rowSet.map(row => row[allStar.headers.indexOf('SEASON_ID')]);
  return {seasons, career, allStarSeasons};
};

const fetchCommonPlayerInfo = (playerId) => {
  return $.ajax('https://stats.nba.com/stats/commonplayerinfo',
    {
      method: 'GET',
      data: {
        LeagueID: '00',
        PlayerID: playerId
      }
    })
};

const formatPlayerProfile = (response) => {
  const headers = response.resultSets[0].headers;
  const profileData = response.resultSets[0].rowSet[0];

  const getProfileValue = (key) => {
    return profileData[headers.indexOf(key)];
  };

  return {
    draft:    formatDraft(getProfileValue('DRAFT_YEAR'), getProfileValue('DRAFT_ROUND'), getProfileValue('DRAFT_NUMBER')),
    birthday: formatBirthday(getProfileValue('BIRTHDATE')),
    weight:   formatWeight(getProfileValue('WEIGHT')),
    team:     formatTeam(getProfileValue('TEAM_NAME'), getProfileValue('TEAM_CITY')),
    number:   getProfileValue('JERSEY') || 'n/a',
    position: getProfileValue('POSITION') || 'n/a',
    height:   getProfileValue('HEIGHT') || 'n/a',
    country:  getProfileValue('COUNTRY') || 'n/a',
    college:  getProfileValue('SCHOOL') || 'n/a',
    imageUrl: getPlayerImageUrl(getProfileValue('DISPLAY_FIRST_LAST'))
  };
};

const formatDraft = (draftYear, draftRound, draftNumber) => {
  if (draftYear) {
    return (draftYear === 'Undrafted')
      ? draftYear
      : draftYear + ', Round ' + draftRound
      + ', Pick ' + draftNumber;
  } else {
    return 'n/a';
  }
};

const formatBirthday = (birthday) => {
  return birthday ? birthday.split('T')[0] : 'n/a'
};

const formatWeight = (weight) => {
  return weight ? weight + ' lb' : 'n/a';
};

const formatTeam = (teamName, city) => {
  return (teamName && city) ? city.charAt(0).toUpperCase() + city.slice(1) + ' ' + teamName: 'n/a';
};

const getPlayerImageUrl = (fullName) => {
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

  return 'https://d2cwpp38twqe55.cloudfront.net/req/'+ dateStr + '/images/players/' + surNameAbb + firstNameAbb + imageRef + '.jpg';
};

addListeners();
