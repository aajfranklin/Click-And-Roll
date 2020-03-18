const utils = new Utils();
const clickAndRoll = new ClickAndRoll();

window.addEventListener('yt-navigate-start', () => {
  window.location.reload();
});

chrome.runtime.onMessage.addListener(clickAndRoll.handleMessage);

window.addEventListener('load', () => {
  utils.sendRuntimeMessage({message: 'load'});
});
