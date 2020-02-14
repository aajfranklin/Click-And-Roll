function Utils() {

  this.sendRuntimeMessage = (request) => {
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

  this.getActiveTab = () => {
    return new Promise(resolve => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>{
        return resolve(tabs[0]);
      });
    });
  };

  this.getTabUrl = (tab) => {
    const isEmptyTab = tab === undefined
      || tab.url === ''
      || tab.url === ('chrome://new-tab-page/')
      || tab.url === 'chrome://newtab/';
    return isEmptyTab
      ? 'chrome://newtab/'
      : (new URL(tab.url)).hostname
  };

  this.messageActiveTab = (request) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, request)
    });
  };

  this.saveToLocalStorage = (name, value) => {
    chrome.storage.local.set({[name]: value}, () => {});
  };

  this.saveToSyncStorage = (name, value) => {
    return new Promise(resolve => {
      chrome.storage.sync.set({[name]: value}, () => {
        return resolve();
      });
    });
  };

  this.isSettingOn = (setting) => {
    return new Promise(resolve => {
      chrome.storage.sync.get(setting, result => {
        if ($.isEmptyObject(result)) {
          return resolve(true);
        }
        return resolve(!!result[setting]);
      });
    });
  };

  this.isExtensionOn = (domain) => {
    return this.isSettingOn('clickAndRoll')
      .then(isExtensionOn => {
        if (isExtensionOn) {
          return this.isSettingOn(domain);
        }
        return Promise.resolve(false);
      })
      .then(isDomainOn => {
        return isDomainOn;
      })
  }

}
