function Popup() {
  this.utils = new Utils();
  this.tab = null;

  this.toggleCheckbox = (id) => {
    const checkbox = document.getElementById(id);
    if (checkbox.getAttribute('checked') === 'checked') {
      checkbox.removeAttribute('checked');
    } else {
      checkbox.setAttribute('checked', 'checked');
    }
  };

  this.toggleSetting = (setting) => {
    if (config.defaultOffSettings.indexOf(setting) !== -1) {
      return this.utils.isSettingOn(setting)
        .then(isSettingOn => {
          if (isSettingOn) {
            return this.utils.removeFromSyncStorage(setting);
          }
          return this.utils.saveToSyncStorage(setting, 'true');
        })
    }

    return this.utils.isSettingOn(setting)
      .then(isSettingOn => {
        if (isSettingOn) {
          return this.utils.saveToSyncStorage(setting, '')
            .then(() => {
              this.utils.messageActiveTab({message: 'stop'});
              chrome.browserAction.setIcon({path: '../assets/static/inactive32.png', tabId: this.tab.id});
            })
        } else {
          this.utils.removeFromSyncStorage(setting);
          return this.utils.isExtensionOn(this.utils.getTabUrl(this.tab))
            .then(isExtensionOnForDomain => {
              if (isExtensionOnForDomain) {
                this.utils.messageActiveTab({message: 'start'});
                chrome.browserAction.setIcon({path: '../assets/static/active32.png', tabId: this.tab.id});
              }
            });
        }
      });
  };

  this.addToggleAnimation = (slider) => {
    slider.classList.add('slider');
    slider.classList.remove('slider-initial');
  };

  this.initialiseSettings = () => {
    return this.utils.getActiveTab()
      .then(tab => {
        this.tab = tab;
        return this.utils.isSettingOn(this.utils.getTabUrl(this.tab));
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('domain-toggle');
        return this.utils.isSettingOn('clickAndRoll');
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('extension-toggle');
        return this.utils.isSettingOn('reverse');
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('reverse-toggle');
      });
  };

  this.handleClick = (e) => {
    const id = e.target.id;
    const targetIsToggle = id.indexOf('-toggle') !== -1;
    const targetIsLink = e.target.href !== undefined;

    if (targetIsToggle) {
      const slider = e.target.nextElementSibling;

      if (slider.classList.contains('slider-initial')) {
        this.addToggleAnimation(slider);
      }

      this.toggleCheckbox(id);
      if (id === 'domain-toggle') this.toggleSetting(this.utils.getTabUrl(this.tab));
      if (id === 'extension-toggle') this.toggleSetting('clickAndRoll');
      if (id === 'reverse-toggle') this.toggleSetting('reverse');
    }

    if (targetIsLink) chrome.tabs.create({url: e.target.href});
  };
}
