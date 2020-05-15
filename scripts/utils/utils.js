function Utils() {

  this.sendRuntimeMessage = (request) => {
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(request, (response => {
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
      browser.tabs.query({active: true, currentWindow: true}, (tabs) =>{
        return resolve(tabs[0]);
      });
    });
  };

  this.getTabUrl = (tab) => {
    const isEmptyTab = tab === undefined
      || tab.url === ''
      || tab.url === 'chrome://new-tab-page/'
      || tab.url === 'chrome://newtab/'
      || tab.url === 'about:newtab'
      || tab.url === 'edge://newtab/'
      || tab.url === 'chrome://startpageshared/';
    return isEmptyTab
      ? 'browser://newtab/'
      : (new URL(tab.url)).hostname
  };

  this.messageActiveTab = (request) => {
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length === 0) return; // prevent tabs[0] undefined if using breakpoints in background script debug window
      browser.tabs.sendMessage(tabs[0].id, request)
    });
  };

  this.saveToLocalStorage = (name, value) => {
    browser.storage.local.set({[name]: value}, () => {});
  };


  this.getFromLocalStorage = (name) => {
    return new Promise(resolve => {
      browser.storage.local.get([name], result => {
        return resolve(!result || $.isEmptyObject(result) ? null : result[name]);
      })
    })
  };

  this.removeFromLocalStorage = (name) => {
    browser.storage.local.remove([name], () => {})
  };

  this.getFromSyncStorage = (name) => {
    return new Promise(resolve => {
      browser.storage.sync.get([name], result => {
        return resolve(!result || $.isEmptyObject(result) ? null : result[name]);
      })
    })
  };

  this.saveToSyncStorage = (name, value) => {
    return new Promise(resolve => {
      browser.storage.sync.set({[name]: value}, () => {
        return resolve();
      });
    });
  };

  this.removeFromSyncStorage = (name) => {
    return new Promise(resolve => {
      browser.storage.sync.remove([name], () => {
        return resolve();
      });
    });
  };

  this.isSettingOn = (setting) => {
    const isDomainSetting = config.nonCustomSettings.indexOf(setting) === -1;
    const isOnByDefault = config.defaultOffSettings.indexOf(setting) === -1;
    let whitelist;

    return this.getFromSyncStorage('whitelist')
      .then(result => {
        whitelist = result !== null;
        return this.getFromSyncStorage(setting);
      })
      .then(result => {
        if (isDomainSetting) return Promise.resolve(whitelist ? result !== null : result === null);
        return Promise.resolve(isOnByDefault ? result === null : result !== null);
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
