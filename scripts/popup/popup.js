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

  this.toggleSetting = (setting, activeTabDomain) => {
    return this.utils.isSettingOn(setting)
      .then(isSettingOn => {
        if (isSettingOn) {
          return this.utils.saveToSyncStorage(setting, '')
            .then(() => {
              this.utils.messageActiveTab({message: 'stop'});
            })
        } else {
          return this.utils.saveToSyncStorage(setting, 'true')
            .then(() => {
              return this.utils.isExtensionOn(activeTabDomain);
            })
            .then(isExtensionOnForDomain => {
              if (isExtensionOnForDomain) this.utils.messageActiveTab({message: 'start'});
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
