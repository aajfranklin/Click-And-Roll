chrome.runtime.onMessage.addListener(onFetchPlayers);
chrome.runtime.onMessage.addListener(onFetchStats);

function onFetchPlayers(request, sender, sendResponse) {
  if (request.message === 'fetchPlayers') {
    $.ajax('https://stats.nba.com/stats/commonallplayers',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          Season: '2018-19',
          IsOnlyCurrentSeason: '0'
        }
      })
      .then(response => {
        const players = response.resultSets[0].rowSet.map((player) => {
          return {
            id: player[0],
            name: player[2]
          }
        });
        sendResponse([null, players]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true;
}

function onFetchStats(request, sender, sendResponse) {
  if (request.message === 'fetchStats') {

    const stats = {
      career: null,
      id: request.playerId,
      profile: null
    };

    let imageUrl;

    $.ajax('https://stats.nba.com/stats/playercareerstats',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          PerMode: 'PerGame',
          PlayerID: request.playerId
        }
      })
      .then(response => {
        stats.career = {seasons: response.resultSets[0], career: response.resultSets[1]};
        return $.ajax('https://stats.nba.com/stats/commonplayerinfo',
          {
            method: 'GET',
            data: {
              LeagueID: '00',
              PlayerID: request.playerId
            }
          })
      })
      .then(response => {
        const headers = response.resultSets[0].headers;
        const profileData = response.resultSets[0].rowSet[0];

        const teamName = profileData[headers.indexOf('TEAM_NAME')];
        const city = profileData[headers.indexOf('TEAM_CITY')];
        const birthday = profileData[headers.indexOf('BIRTHDATE')];
        const weight = profileData[headers.indexOf('WEIGHT')];

        const draftYear = profileData[headers.indexOf('DRAFT_YEAR')];
        let draft;
        if (draftYear) {
          draft = (draftYear === 'Undrafted')
            ? draftYear
            : draftYear + ', Round ' + profileData[headers.indexOf('DRAFT_ROUND')]
                        + ', Pick ' + profileData[headers.indexOf('DRAFT_NUMBER')];
        } else {
          draft = 'n/a';
        }


        stats.profile = {
          draft,
          birthday: birthday ? birthday.split('T')[0] : 'n/a',
          weight:   weight ? weight + ' lb' : 'n/a',
          team:     (teamName && city) ? teamName + ' ' + city.charAt(0).toUpperCase() + city.slice(1) : 'n/a',
          number:   profileData[headers.indexOf('JERSEY')] || 'n/a',
          position: profileData[headers.indexOf('POSITION')]  || 'n/a',
          height:   profileData[headers.indexOf('HEIGHT')]  || 'n/a',
          country:  profileData[headers.indexOf('COUNTRY')]  || 'n/a',
          college:  profileData[headers.indexOf('SCHOOL')]  || 'n/a'
        };

        imageUrl = 'https://nba-players.herokuapp.com/players/'
          + profileData[headers.indexOf('LAST_NAME')] + '/'
          + profileData[headers.indexOf('FIRST_NAME')];

        return $.ajax(imageUrl);
      })
      .then(response => {
        if (response !== 'Sorry, that player was not found. Please check the spelling.') {
          stats.profile.image = imageUrl;
        }
        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true
}
