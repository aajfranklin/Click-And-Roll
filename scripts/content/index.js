const utils = new Utils();
const clickAndRoll = new ClickAndRoll();

chrome.runtime.onMessage.addListener(clickAndRoll.handleMessage);

window.addEventListener('load', () => {
  utils.sendRuntimeMessage({message: 'load'});
});
