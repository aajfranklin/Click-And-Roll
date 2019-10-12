const utils = new Utils();

const toggleCheckbox = (id) => {
  const checkbox = document.getElementById(id);
  if (checkbox.getAttribute('checked') === 'checked') {
    checkbox.removeAttribute('checked');
  } else {
    checkbox.setAttribute('checked', 'checked');
  }
};

const toggleSetting = (setting, activeTabDomain) => {
  utils.isSettingOn(setting)
    .then(isSettingOn => {
      if (isSettingOn) {
        utils.saveToSyncStorage(setting, '')
          .then(() => {
            utils.messageActiveTab({message: 'stop'});
          })
      } else {
        utils.saveToSyncStorage(setting, 'true')
          .then(() => {
            return utils.isExtensionOn(activeTabDomain);
          })
          .then(isExtensionOnForDomain => {
            if (isExtensionOnForDomain) utils.messageActiveTab({message: 'start'});
          });
      }
    })
};

const addToggleAnimation = (slider) => {
  slider.classList.add('slider');
  slider.classList.remove('slider-initial');
};

utils.getActiveTab()
  .then(tab => {
    return utils.isSettingOn((new URL(tab.url)).hostname);
  })
  .then(isOn => {
    if (isOn) toggleCheckbox('domain-toggle');
    return utils.isSettingOn('clickAndRoll');
  })
  .then(isOn => {
    if (isOn) toggleCheckbox('extension-toggle');
  });

window.addEventListener('click',function(e){
  if (e.target.href !== undefined) {
    chrome.tabs.create({ url: e.target.href });
  }

  if (e.target.id === 'extension-toggle') {
    const slider = e.target.nextElementSibling;
    if (slider.classList.contains('slider-initial')) addToggleAnimation(slider);

    toggleCheckbox('extension-toggle');
    utils.getActiveTab()
      .then(tab => {
        toggleSetting('clickAndRoll', (new URL(tab.url)).hostname)
      });
  }

  if (e.target.id === 'domain-toggle') {
    const slider = e.target.nextElementSibling;
    if (slider.classList.contains('slider-initial')) addToggleAnimation(slider);

    toggleCheckbox('domain-toggle');
    utils.getActiveTab()
      .then(tab => {
        const domain = (new URL(tab.url)).hostname;
        toggleSetting(domain, domain);
      });
  }
});
