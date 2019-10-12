const utils = new Utils();
const clickAndRoll = new ClickAndRoll();

const start = () => {
  chrome.storage.local.get(['players'], (cachedPlayers) => {
    utils.checkPlayers(cachedPlayers)
      .then((players) => {
        clickAndRoll.setPlayers(players);
        clickAndRoll.run();
      });
  });
};

const stop = () => {
  clickAndRoll.teardown()
};

const handleMessage = (request) => {
  switch (request.message) {
    case 'start':
      if (!clickAndRoll.isRunning) {
        start();
      }
      break;
    case 'stop':
      if (clickAndRoll.isRunning) {
        stop();
      }
      break;
    default:
      return;
  }
};

chrome.runtime.onMessage.addListener(handleMessage);

window.addEventListener('load', () => {
  utils.isExtensionOn(window.location.hostname)
    .then(isOn => {
      if (isOn) start();
    })
});
