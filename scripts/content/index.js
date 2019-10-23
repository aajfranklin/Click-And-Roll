const utils = new Utils();
const clickAndRoll = new ClickAndRoll();

chrome.runtime.onMessage.addListener(clickAndRoll.handleMessage);

window.addEventListener('load', () => {
  utils.isExtensionOn(window.location.hostname)
    .then(isOn => {
      if (isOn) clickAndRoll.run();
    })
});
