window.addEventListener('load', () => {
  chrome.storage.local.get(['players'], (cachedPlayers) => {
    const utils = new Utils();
    utils.checkPlayers(cachedPlayers)
      .then((players) => {
        const clickAndRoll = new ClickAndRoll(players);
        clickAndRoll.run();
      });
  });
});
