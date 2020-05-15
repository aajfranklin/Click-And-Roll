function Popup() {
  this.utils = new Utils();
  this.tab = null;

  this.loadSiteList = () => {
    browser.storage.sync.get(null, res => {
      const sites = Object.keys(res).filter(key => key !== 'clickAndRoll' && key !== "dark" && key !== "reverse");

      if (sites.length > 0) {
        let siteListHTML = '<ul>';
        const buttonHTML = '<button><svg data-prefix="fas" data-icon="times-circle" class="svg-inline--fa fa-times-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path></svg></button>';
        sites.forEach(site => {
          siteListHTML += `<li><span>${site}</span>${buttonHTML}</li>`;
        });

        siteListHTML += '</ul>';
        document.getElementById('sites-section').innerHTML = siteListHTML;
        return;
      }

      document.getElementById('sites-section').innerHTML = '';
    })
  };

  this.toggleCheckbox = (id) => {
    const checkbox = document.getElementById(id);
    if (checkbox.getAttribute('checked') === 'checked') {
      checkbox.removeAttribute('checked');
    } else {
      checkbox.setAttribute('checked', 'checked');
    }
  };

  this.toggleOnOffSetting = (setting) => {
    return this.utils.isSettingOn(setting)
      .then(isSettingOn => {
        if (isSettingOn) {
          return this.utils.saveToSyncStorage(setting, '')
            .then(() => {
              this.utils.messageActiveTab({message: 'stop'});
              browser.browserAction.setIcon({path: '../assets/static/inactive32.png', tabId: this.tab.id});
            })
        } else {
          this.utils.removeFromSyncStorage(setting);
          return this.utils.isExtensionOn(this.utils.getTabUrl(this.tab))
            .then(isExtensionOnForDomain => {
              if (isExtensionOnForDomain) {
                this.utils.messageActiveTab({message: 'start'});
                browser.browserAction.setIcon({path: '../assets/static/active32.png', tabId: this.tab.id});
              }
            });
        }
      });
  };

  this.toggleSetting = (setting) => {
    return this.utils.isSettingOn(setting)
      .then(isOn => {
        if (setting === 'dark') this.applyColourScheme(!isOn);
        if (setting === 'reverse') this.utils.messageActiveTab({message: 'toggle-reverse', isOn: !isOn});
        if (isOn) {
          return this.utils.removeFromSyncStorage(setting);
        }
        return this.utils.saveToSyncStorage(setting, 'true');
      })
  };

  this.applyColourScheme = (isDark) => {
    this.utils.messageActiveTab({message: 'toggle-dark', isOn: isDark});
    if (isDark) {
      document.body.classList.add('dark-mode');
      return;
    }
    document.body.classList.remove('dark-mode');
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
        if (isOn) this.toggleCheckbox('domain-input');
        return this.utils.isSettingOn('clickAndRoll');
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('extension-input');
        return this.utils.isSettingOn('reverse');
      })
      .then(isOn => {
        if (isOn) this.toggleCheckbox('reverse-input');
        return this.utils.isSettingOn('dark');
      })
      .then(isOn => {
        if (isOn) {
          this.toggleCheckbox('dark-input');
          this.applyColourScheme(true);
        }
        this.loadSiteList();
      });
  };

  this.handleClick = (e) => {
    e.preventDefault();
    const targetIsSlider = e.target.id.indexOf('-slider') !== -1;
    const targetIsTab = e.target.classList.contains('tab');
    const targetIsLink = e.target.href !== undefined;
    const isButton = e.target.tagName === 'BUTTON';

    if (targetIsSlider) return this.handleToggle(e);
    if (targetIsTab) return this.updateActiveTab(e);
    if (isButton) return this.handleButton(e);
    if (targetIsLink) browser.tabs.create({url: e.target.href});
  };

  this.handleToggle = (e) => {
    const id = e.target.id;

    if (e.target.classList.contains('slider-initial')) {
      this.addToggleAnimation(e.target);
    }

    this.toggleCheckbox(`${id.split('-')[0]}-input`);
    if (id === 'domain-slider') this.toggleOnOffSetting(this.utils.getTabUrl(this.tab)).then(() => this.loadSiteList());
    if (id === 'extension-slider') this.toggleOnOffSetting('clickAndRoll');
    if (id === 'reverse-slider') this.toggleSetting('reverse');
    if (id === 'dark-slider') this.toggleSetting('dark');
  };

  this.updateActiveTab = (e) => {
    const tabs = document.getElementsByClassName('tab');
    for (let tab of tabs) tab.classList.remove('active');
    e.target.classList.add('active');

    const tabSections = document.getElementsByClassName('tab-section');
    for (let section of tabSections) section.classList.remove('active');
    document.getElementById(`${e.target.id}-section`).classList.add('active');
  };

  this.handleButton = (e) => {
    const urlToRemove = e.target.previousElementSibling.textContent;
    const tabUrl = this.utils.getTabUrl(this.tab);
    if (urlToRemove === tabUrl) this.toggleCheckbox('domain-input');
    this.toggleOnOffSetting(urlToRemove).then(() => this.loadSiteList());
  }
}
