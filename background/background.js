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
  const stats = {
    career: null,
    id: request.id,
    profile: null
  };

  let imageUrl;

  if (request.message === 'fetchStats') {
    $.ajax('https://stats.nba.com/stats/playercareerstats',
      {
        method: 'GET',
        data: {
          LeagueID: '00',
          PerMode: 'PerGame',
          PlayerID: request.id
        }
      })
      .then(response => {
        stats.career = {seasons: response.resultSets[0], career: response.resultSets[1]};
        return $.ajax('https://stats.nba.com/stats/commonplayerinfo',
          {
            method: 'GET',
            data: {
              LeagueID: '00',
              PlayerID: request.id
            }
          })
      })
      .then(response => {
        const profileData = response.resultSets[0].rowSet[0];

        stats.profile = {
          team: profileData[20] + ' ' + profileData[19].charAt(0).toUpperCase() + profileData[19].slice(1),
          number: profileData[13],
          position: profileData[14],
          birthday: profileData[6].split('T')[0],
          height: profileData[10],
          weight: profileData[11] + ' lb',
          country: profileData[8],
          college: profileData[7],
          draft: profileData[27] + ' R' + profileData[28] + ' P' + profileData[29]
        };

        imageUrl = 'https://nba-players.herokuapp.com/players/' + profileData[2] + '/' + profileData[1];

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
