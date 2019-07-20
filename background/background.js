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
        const stats = {seasons: response.resultSets[0], career: response.resultSets[1]};
        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true
}
