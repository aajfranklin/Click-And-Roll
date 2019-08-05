const backgroundScriptFetch = (request) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response => {
      const [err, res] = response;
      if (err != null) {
        reject(err);
      } else {
        resolve(res);
      }
    }));
  });
};

const saveToChromeStorage = (name, values) => {
  chrome.storage.local.set({[name]: values}, () => {
    console.log(name + ' saved');
  });
};

const run = (players) => {
  frameContainer = document.createElement('div');
  clickAndRollFrame = document.createElement('iframe');
  statDisplay = document.createElement('div');
  frameContainer.id = 'click-and-roll-frame-container';
  clickAndRollFrame.id ='click-and-roll-frame';
  statDisplay.id = 'stat-display';

  $.ajax(chrome.extension.getURL('view/frame.html'), {method: 'GET'})
    .then(response => {
      statTemplate = response;
      return $.ajax(chrome.extension.getURL('view/frame.css'), {method: 'GET'})
    })
    .then(response => {
      frameStyle = response;
      lastBodyText = document.body.textContent;
      const playerNames = players.map((player) => player.name);
      const initialResults = searchTextContent(document.body, playerNames);

      if (initialResults.length > 0) {
        locateAndFormatResults(document.body, initialResults);
      }

      observeMutations(playerNames);
    });
};

const checkPlayerCache = () => {
  chrome.storage.local.get(['players'], (response) => {
    players = response.players;

    if (players === undefined) {
      backgroundScriptFetch({message: 'fetchPlayers'})
        .then(players => {
          saveToChromeStorage('players', players);
          run(players);
        })
        .catch(err => {
          console.log(err);
        })
    } else {
      run(players);
    }
  });
};

let players;
let frameContainer;
let clickAndRollFrame;
let statDisplay;
let statTemplate;
let currentPlayerId;
let dataReceived;
let frameStyle;
let namePosition = {};
let currentNameElement;
let lastBodyText;

window.addEventListener('load', checkPlayerCache);
