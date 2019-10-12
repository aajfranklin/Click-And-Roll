const messageHandler = new MessageHandler();
messageHandler.addListener();

chrome.tabs.onActivated.addListener(() => {
  const utils = new Utils();
  utils.getActiveTab()
    .then(tab => {
      return utils.isExtensionOn((new URL(tab.url)).hostname);
    })
    .then(isExtensionOnForDomain => {
      if (isExtensionOnForDomain) {
        utils.messageActiveTab({message: 'start'});
      } else {
        utils.messageActiveTab({message: 'stop'});
      }
    });
});
