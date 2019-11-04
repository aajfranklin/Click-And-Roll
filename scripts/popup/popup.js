function Popup() {
  this.utils = new Utils();

  this.toggleCheckbox = (id) => {
    const checkbox = document.getElementById(id);
    if (checkbox.getAttribute('checked') === 'checked') {
      checkbox.removeAttribute('checked');
    } else {
      checkbox.setAttribute('checked', 'checked');
    }
  };

  this.toggleSetting = (setting, tab) => {
    return this.utils.isSettingOn(setting)
      .then(isSettingOn => {
        if (isSettingOn) {
          return this.utils.saveToSyncStorage(setting, '')
            .then(() => {
              this.utils.messageActiveTab({message: 'stop'});
              chrome.browserAction.setIcon({path: '../assets/inactive32.png', tabId: tab.id});
            })
        } else {
          return this.utils.saveToSyncStorage(setting, 'true')
            .then(() => {
              return this.utils.isExtensionOn((new URL(tab.url)).hostname);
            })
            .then(isExtensionOnForDomain => {
              if (isExtensionOnForDomain) {
                this.utils.messageActiveTab({message: 'start'});
                chrome.browserAction.setIcon({path: '../assets/active32.png', tabId: tab.id});
              }
            });
        }
      })
  };

  this.addToggleAnimation = (slider) => {
    slider.classList.add('slider');
    slider.classList.remove('slider-initial');
  };

  this.initialiseSettings = () => {
    return this.utils.getActiveTab()
      .then(tab => {
        return this.utils.isSettingOn((new URL(tab.url)).hostname);
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('domain-toggle');
        return this.utils.isSettingOn('clickAndRoll');
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('extension-toggle');
      });
  };
}
