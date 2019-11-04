const messageHandler = new MessageHandler();
messageHandler.addListener();

chrome.tabs.onActivated.addListener(() => {
  messageHandler.handleLoad();
});
