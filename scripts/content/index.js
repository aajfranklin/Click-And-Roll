window.addEventListener('DOMContentLoaded', () => {
  const clickAndRoll = new ClickAndRoll();
  browser.runtime.onMessage.addListener(clickAndRoll.handleMessage);

  const utils = new Utils();
  utils.sendRuntimeMessage({message: 'load'});
});
