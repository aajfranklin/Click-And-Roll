function Popup() {
  this.utils = new Utils();
  this.tab = null;

  this.loadSiteList = () => {
    this.getSites()
      .then(sites => {
        let siteListHTML = '<ul>';
        const buttonHTML = config.buttonString;

        sites.forEach(site => {
          siteListHTML += `<li><span>${site}</span>${buttonHTML}</li>`;
        });

        siteListHTML += '</ul>';
        document.getElementById('sites-list-container').innerHTML = siteListHTML;
      });
  };

  this.toggleCheckbox = (id) => {
    const checkbox = document.getElementById(id);
    if (checkbox.getAttribute('checked') === 'checked') {
      checkbox.removeAttribute('checked');
    } else {
      checkbox.setAttribute('checked', 'checked');
    }
  };

  this.getSites = () => {
    return utils.getFromSyncStorage()
      .then(res => res ? Object.keys(res).filter(key => config.nonCustomSettings.indexOf(key) === -1) : []);
  };

  this.toggleSetting = (setting) => {
    const isOnByDefault = config.defaultOffSettings.indexOf(setting) === -1;

    return this.utils.isSettingOn(setting)
      .then(isOn => {
        if (setting === 'dark') this.applyColourScheme(!isOn);
        if (setting === 'reverse') this.utils.messageActiveTab({message: 'toggle-reverse', isOn: !isOn});
        if (isOn) return  isOnByDefault ? this.utils.saveToSyncStorage(setting, '') : this.utils.removeFromSyncStorage(setting);
        return isOnByDefault ? this.utils.removeFromSyncStorage(setting) : this.utils.saveToSyncStorage(setting, 'true');
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

  this.updateIconAndStatus = () => {
    return this.utils.isExtensionOn(this.utils.getTabUrl(this.tab))
      .then(isExtensionOnForDomain => {
        if (isExtensionOnForDomain) {
          this.utils.messageActiveTab({message: 'start'});
          browser.browserAction.setIcon({path: '../assets/static/active32.png', tabId: this.tab.id});
        } else {
          this.utils.messageActiveTab({message: 'stop'});
          browser.browserAction.setIcon({path: '../assets/static/inactive32.png', tabId: this.tab.id});
        }
      });
  };

  this.addToggleAnimation = (slider) => {
    slider.classList.add('slider');
    slider.classList.remove('slider-initial');
  };

  this.initialiseSettings = () => {
    let whitelist;

    return this.utils.getActiveTab()
      .then(tab => {
        this.tab = tab;
        return this.utils.isSettingOn('whitelist');
      }).then((isOn) => {
        whitelist = isOn;
        if (whitelist) document.getElementById('whitelist').classList.add('active');
        if (!whitelist) document.getElementById('blacklist').classList.add('active');
        return this.utils.isSettingOn(this.utils.getTabUrl(this.tab));
      })
      .then(isOn => {
        if ((isOn && !whitelist) || (!isOn && whitelist)) this.toggleCheckbox('domain-input');
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
    const targetIsNamedToggle = e.target.classList.contains('named-toggle-button');
    const targetIsTab = e.target.classList.contains('tab');
    const targetIsLink = e.target.href !== undefined;
    const isButton = e.target.tagName === 'BUTTON';

    if (targetIsSlider) return this.handleToggle(e);
    if (targetIsNamedToggle) return this.handleNamedToggle(e);
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

    switch (id) {
      case 'domain-slider':
        return this.toggleSetting(this.utils.getTabUrl(this.tab))
          .then(() => this.updateIconAndStatus())
          .then(() => this.loadSiteList());
      case 'extension-slider':
        return this.toggleSetting('clickAndRoll').then(() => this.updateIconAndStatus());
      case 'reverse-slider':
        return this.toggleSetting('reverse');
      case 'dark-slider':
        return this.toggleSetting('dark');
      default:
        return
    }
  };

  this.handleNamedToggle = (e) => {
    if (e.target.classList.contains('active')) return;

    const namedToggleButtons = document.getElementsByClassName('named-toggle-button');
    for (let button of namedToggleButtons) button.classList.remove('active');
    e.target.classList.add('active');

    return this.toggleSetting('whitelist')
      .then(() => this.updateIconAndStatus())
      .then(() => this.toggleCheckbox('domain-input'));
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
    return this.toggleSetting(urlToRemove)
      .then(() => this.updateIconAndStatus())
      .then(() => this.loadSiteList());
  }
}
