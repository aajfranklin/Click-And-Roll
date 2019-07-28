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

        const fullName = profileData[headers.indexOf('DISPLAY_FIRST_LAST')];
        const names = fullName.split(' ');
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

        const imageUrl = 'https://d2cwpp38twqe55.cloudfront.net/req/'+ dateStr + '/images/players/' + surNameAbb + firstNameAbb + imageRef + '.jpg';

        stats.profile = {
          draft,
          birthday: birthday ? birthday.split('T')[0] : 'n/a',
          weight:   weight ? weight + ' lb' : 'n/a',
          team:     (teamName && city) ? city.charAt(0).toUpperCase() + city.slice(1) + ' ' + teamName: 'n/a',
          number:   profileData[headers.indexOf('JERSEY')] || 'n/a',
          position: profileData[headers.indexOf('POSITION')] || 'n/a',
          height:   profileData[headers.indexOf('HEIGHT')] || 'n/a',
          country:  profileData[headers.indexOf('COUNTRY')] || 'n/a',
          college:  profileData[headers.indexOf('SCHOOL')] || 'n/a',
          imageUrl
        };

        sendResponse([null, stats]);
      })
      .catch(err => {
        sendResponse([err, null]);
      });
  }
  return true
}

const playerImageRefMap = {
  "Dairis Bertans": "02",
  "Bojan Bogdanovic": "02",
  "Miles Bridges": "02",
  "Anthony Brown": "02",
  "Jaylen Brown": "02",
  "Daequan Cook": "02",
  "Anthony Davis": "02",
  "Jacob Evans": "02",
  "Jerian Grant": "02",
  "Danny Green": "02",
  "Jaxson Hayes": "02",
  "Marc Jackson": "02",
  "Alize Johnson": "02",
  "Armon Johnson": "02",
  "Cameron Johnson": "02",
  "JaJuan Johnson": "02",
  "Magic Johnson": "02",
  "Dahntay Jones": "02",
  "Damian Jones": "03",
  "Derrick Jones Jr.": "02",
  "Dominique Jones": "02",
  "Donny Marshall": "02",
  "Kevin Martin": "02",
  "Patty Mills": "02",
  "Cherokee Parks": "02",
  "Marshall Plumlee": "02",
  "Taurean Prince": "02",
  "Willie Reed": "02",
  "Clifford Robinson": "02",
  "Isaiah Thomas": "02",
  "Trey Thompkins": "02",
  "Mychel Thompson": "02",
  "Mario West": "02",
  "Derrick Williams": "02",
  "Jason Williams": "02",
  "Jay Williams": "03",
  "Jawad Williams": "04",
  "John Williams": "02",
  "Jordan Williams": "03",
  "Johnathan Williams": "04",
  "Kevin Willis": "02",
  "Kenny Williams": "03",
  "Kenrich Williams": "04",
  "Marvin Williams": "02",
  "Marcus Williams": "02",
  "Shelden Williams": "02",
  "Shawne Williams": "03",
  "Justin Wright-Foreman": "02",
};
